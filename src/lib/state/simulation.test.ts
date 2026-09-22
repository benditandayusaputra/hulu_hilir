import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { replay, scenarioById, type Scenario } from '$lib/sim';
import { announcer } from './announcer.svelte';
import { settings } from './settings.svelte';
import {
	cellTileId,
	MONTH_INTERVAL_MS,
	SimulationSession,
	toolGroups,
	toolId,
	type CellRef
} from './simulation.svelte';
import { toaster } from './toast.svelte';

function scenario(id: string): Scenario {
	const found = scenarioById(id);
	if (found === null) throw new Error(`scenario ${id} missing`);
	return found;
}

const factoryTile: CellRef = { segment: 2, column: 1 };
const waterCell: CellRef = { segment: 3, column: 2 };

describe('SimulationSession', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		announcer.clear();
		toaster.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('memetakan kolom ke id petak dan sel air', () => {
		expect(cellTileId({ segment: 3, column: 0 })).toBe('S3-L2');
		expect(cellTileId({ segment: 3, column: 1 })).toBe('S3-L1');
		expect(cellTileId({ segment: 3, column: 3 })).toBe('S3-R1');
		expect(cellTileId({ segment: 3, column: 4 })).toBe('S3-R2');
		expect(cellTileId(waterCell)).toBeNull();
	});

	it('mengelompokkan semua alat dengan id unik', () => {
		const ids = toolGroups.flatMap((group) => group.tools.map(toolId));
		expect(new Set(ids).size).toBe(ids.length);
		expect(ids).toContain('change_land_use:factory');
		expect(ids).toContain('ipal_industrial');
		expect(ids).toContain('enforcement');
	});

	it('menampilkan aksi yang menunggu pada state pratinjau tanpa mengubah snapshot', () => {
		const session = new SimulationSession(scenario('desa'));
		expect(session.install({ type: 'change_land_use', choice: 'factory' }, factoryTile)).toBe(true);
		expect(session.tileAt(factoryTile)?.landUse).toBe('factory');
		expect(session.latest.tiles.find((tile) => tile.id === 'S2-L1')?.landUse).toBe('forest');
		expect(session.pending).toHaveLength(1);
		expect(session.month).toBe(0);
	});

	it('menolak alat yang tidak cocok dengan alasan yang terbaca', () => {
		const session = new SimulationSession(scenario('desa'));
		const preview = session.previewTool({ type: 'ipal_industrial' }, factoryTile);
		expect(preview.ok).toBe(false);
		expect(preview.reason).toBe('IPAL Industri tidak bisa dipasang di Hutan.');
		expect(session.install({ type: 'ipal_industrial' }, factoryTile)).toBe(false);
		expect(announcer.assertive).toBe('IPAL Industri tidak bisa dipasang di Hutan.');
	});

	it('menolak pintu air di luar segmen 5 dan 6 dengan pesan khusus', () => {
		const session = new SimulationSession(scenario('desa'));
		const preview = session.previewTool({ type: 'floodgate' }, waterCell);
		expect(preview.ok).toBe(false);
		expect(preview.reason).toBe('Pintu Air dan Pompa hanya bisa dipasang di Segmen 5 atau 6.');
		expect(session.previewTool({ type: 'floodgate' }, { segment: 6, column: 2 }).ok).toBe(true);
	});

	it('memasang alat segmen dari sel air dan alat petak hanya di petak', () => {
		const session = new SimulationSession(scenario('desa'));
		expect(session.install({ type: 'greenbelt' }, waterCell)).toBe(true);
		expect(session.segmentAt(3).interventions.map((item) => item.type)).toEqual(['greenbelt']);
		expect(session.install({ type: 'plant_forest' }, waterCell)).toBe(false);
	});

	it('menjalankan bulan dan hasilnya identik dengan replay dari log aksi', () => {
		const session = new SimulationSession(scenario('desa'));
		session.install({ type: 'change_land_use', choice: 'factory' }, factoryTile);
		session.step();
		session.step();
		session.install({ type: 'ipal_industrial' }, factoryTile);
		session.install({ type: 'enforcement' }, waterCell);
		for (let i = 0; i < 10; i += 1) session.step();
		expect(session.month).toBe(12);
		expect(session.log.map((action) => action.month)).toEqual([1, 3, 3]);
		const history = replay(session.scenario, session.seed, session.log, 12);
		expect(session.snapshots).toEqual(history.snapshots);
	});

	it('membatalkan aksi yang menunggu dan kembali ke bulan sebelumnya', () => {
		const session = new SimulationSession(scenario('desa'));
		expect(session.undo()).toBe(false);
		session.install({ type: 'change_land_use', choice: 'paddy' }, factoryTile);
		expect(session.undo()).toBe(true);
		expect(session.pending).toHaveLength(0);
		for (let i = 0; i < 5; i += 1) session.step();
		session.install({ type: 'river_cleanup' }, waterCell);
		session.rewindTo(2);
		expect(session.month).toBe(2);
		expect(session.snapshots).toHaveLength(3);
		expect(session.pending).toHaveLength(0);
		session.rewindTo(9);
		expect(session.month).toBe(2);
	});

	it('memutar waktu sesuai kecepatan dan berhenti saat dijeda', () => {
		const session = new SimulationSession(scenario('alami'));
		session.setSpeed(2);
		session.play();
		expect(session.playing).toBe(true);
		vi.advanceTimersByTime(MONTH_INTERVAL_MS);
		expect(session.month).toBe(2);
		session.pause();
		vi.advanceTimersByTime(MONTH_INTERVAL_MS * 4);
		expect(session.month).toBe(2);
		session.play();
		session.setSpeed(1);
		vi.advanceTimersByTime(MONTH_INTERVAL_MS);
		expect(session.month).toBe(3);
		session.dispose();
		expect(session.playing).toBe(false);
	});

	it('mengumumkan bulan berganti pada frekuensi normal dan kecepatan 1x saja', () => {
		settings.narrationFrequency = 'normal';
		const session = new SimulationSession(scenario('alami'));
		session.step();
		expect(announcer.polite).toMatch(/^Januari tahun 1\. Kualitas air \d+, /);
		announcer.clear();
		session.setSpeed(4);
		session.step();
		expect(announcer.polite).toBe('');
	});

	it('mengumumkan perubahan status segmen lewat toast', () => {
		settings.narrationFrequency = 'important';
		const session = new SimulationSession(scenario('alami'));
		session.install(
			{ type: 'change_land_use', choice: 'dense_settlement' },
			{ segment: 4, column: 1 }
		);
		session.install(
			{ type: 'change_land_use', choice: 'dense_settlement' },
			{ segment: 4, column: 3 }
		);
		let months = 0;
		while (months < 12 && !toaster.items.some((item) => item.message.includes('berubah menjadi'))) {
			session.step();
			months += 1;
		}
		const toast = toaster.items.find((item) => item.message.includes('berubah menjadi'));
		expect(toast?.message).toMatch(/^Segmen \d \w+( \w+)? berubah menjadi Cemar/);
	});

	it('mereset skenario dan membersihkan pilihan', () => {
		const session = new SimulationSession(scenario('desa'));
		session.selection = waterCell;
		session.selectedTool = { type: 'greenbelt' };
		session.step();
		session.reset(scenario('kota-padat'));
		expect(session.month).toBe(0);
		expect(session.scenario.id).toBe('kota-padat');
		expect(session.selection).toBeNull();
		expect(session.selectedTool).toBeNull();
	});
});
