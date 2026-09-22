import { describe, expect, it } from 'vitest';
import { isRobFlood, maxTideInMonth, tideAmplitude } from './daily';
import { statusRank } from './pollutionIndex';
import { finalState, replay } from './replay';
import { defineScenario, layout, scenarios, tileOrder } from './scenarios';
import type { Action, Scenario, SimHistory, SimState } from './types';

const SEED = 1;
const natural = scenarios['alami'] ?? defineScenario({ id: 'alami', tiles: layout('forest') });
const factory = defineScenario({ id: 'pabrik', tiles: layout('forest', { 'S2-L1': 'factory' }) });
const bareUpstream = defineScenario({
	id: 'gundul',
	tiles: layout('forest', {
		'S1-L1': 'open_land',
		'S1-L2': 'open_land',
		'S1-R1': 'open_land',
		'S1-R2': 'open_land',
		'S2-L1': 'open_land',
		'S2-L2': 'open_land',
		'S2-R1': 'open_land',
		'S2-R2': 'open_land'
	})
});
const AUGUST = 8;
const FEBRUARY = 2;

function segment(state: SimState, index: number) {
	const found = state.segments[index - 1];
	if (!found) throw new Error('segmen tidak ada');
	return found;
}

function snapshot(history: SimHistory, month: number): SimState {
	const state = history.snapshots[month];
	if (!state) throw new Error('bulan tidak ada');
	return state;
}

function minimumDoDownstream(history: SimHistory, from: number): number {
	let minimum = Number.POSITIVE_INFINITY;
	for (const state of history.snapshots.slice(1)) {
		for (const item of state.segments) {
			if (item.index >= from) minimum = Math.min(minimum, item.concentrations.do);
		}
	}
	return minimum;
}

function replant(): Action[] {
	return tileOrder
		.filter((id) => id.startsWith('S1-') || id.startsWith('S2-'))
		.map((id): Action => ({ month: 1, type: 'plant_forest', target: id }));
}

describe('uji kalibrasi 4.14', () => {
	const naturalHistory = replay(natural, SEED, [], 24);
	const factoryHistory = replay(factory, SEED, [], 12);

	it('1. Sungai Alami: semua segmen Baik sepanjang tahun dan tidak banjir saat hujan lebat', () => {
		let heavyRainMonths = 0;
		for (const state of naturalHistory.snapshots) {
			const types = state.events.map((event) => event.type);
			if (types.includes('heavy_rain')) {
				heavyRainMonths += 1;
				expect(types).not.toContain('flood');
			}
			for (const item of state.segments) expect(item.status).toBe('good');
		}
		expect(heavyRainMonths).toBeGreaterThan(0);
	});

	it('2. Satu pabrik tanpa IPAL di segmen 2: segmen 2 sampai 4 minimal Cemar ringan pada Agustus dan DO hilir turun minimal 1 mg/L', () => {
		const august = snapshot(factoryHistory, AUGUST);
		for (const index of [2, 3, 4]) {
			expect(statusRank(segment(august, index).status)).toBeGreaterThanOrEqual(statusRank('light'));
		}
		const naturalYear = replay(natural, SEED, [], 12);
		expect(
			minimumDoDownstream(naturalYear, 3) - minimumDoDownstream(factoryHistory, 3)
		).toBeGreaterThanOrEqual(1);
	});

	it('3. IPAL Industri pada kasus 2: IP segmen 3 turun ke 1,5 atau kurang dalam 3 bulan setelah IPAL aktif', () => {
		const installMonth = 6;
		const activeMonth = installMonth + 2;
		const history = replay(
			factory,
			SEED,
			[{ month: installMonth, type: 'ipal_industrial', target: 'S2-L1' }],
			12
		);
		expect(segment(snapshot(factoryHistory, activeMonth), 3).pollutionIndex).toBeGreaterThan(1.5);
		const within = [activeMonth, activeMonth + 1, activeMonth + 2, activeMonth + 3].map(
			(month) => segment(snapshot(history, month), 3).pollutionIndex
		);
		expect(Math.min(...within)).toBeLessThanOrEqual(1.5);
	});

	it('4. Hulu gundul: Risiko Banjir naik minimal 30 poin dan TSS segmen 3 melewati baku kelas 2 pada bulan basah', () => {
		const bare = replay(bareUpstream, SEED, [], 12);
		const risk = snapshot(bare, FEBRUARY).indicators.floodRisk;
		expect(risk - snapshot(naturalHistory, FEBRUARY).indicators.floodRisk).toBeGreaterThanOrEqual(
			30
		);
		expect(segment(snapshot(bare, FEBRUARY), 3).concentrations.tss).toBeGreaterThan(50);
	});

	it('5. Reboisasi hulu: Risiko Banjir turun bertahap dan baru mendekati kondisi alami setelah minimal 24 bulan', () => {
		const replanted = replay(bareUpstream, SEED, replant(), 48);
		const naturalLong = replay(natural, SEED, [], 48);
		const gap = (month: number): number =>
			snapshot(replanted, month).indicators.floodRisk -
			snapshot(naturalLong, month).indicators.floodRisk;
		const yearly = [FEBRUARY, FEBRUARY + 12, FEBRUARY + 24, FEBRUARY + 36].map(gap);
		expect(yearly[0]).toBeGreaterThan(yearly[1] ?? 0);
		expect(yearly[1]).toBeGreaterThan(yearly[2] ?? 0);
		expect(yearly[2]).toBeGreaterThan(yearly[3] ?? 0);
		expect(yearly[1]).toBeGreaterThanOrEqual(30);
		expect(yearly[2]).toBeGreaterThanOrEqual(20);
		expect(yearly[3]).toBeLessThanOrEqual(15);
	});

	it('6. Kota padat tanpa pengolahan: fecal coliform segmen kota di atas 5.000 dan status minimal Cemar sedang pada Agustus', () => {
		const city = replay(scenarios['kota-padat'] ?? natural, SEED, [], 12);
		const kota = segment(snapshot(city, AUGUST), 4);
		expect(kota.concentrations.fecalColiform).toBeGreaterThan(5000);
		expect(statusRank(kota.status)).toBeGreaterThanOrEqual(statusRank('moderate'));
	});

	it('7. Untuk beban yang sama, IP bulan Agustus lebih buruk dari IP bulan Februari', () => {
		for (const index of [2, 3, 4, 5, 6]) {
			expect(segment(snapshot(factoryHistory, AUGUST), index).pollutionIndex).toBeGreaterThan(
				segment(snapshot(factoryHistory, FEBRUARY), index).pollutionIndex
			);
		}
	});

	it('8. Monotonik: menambah beban apa pun tidak pernah memperbaiki mutu di segmen hilirnya', () => {
		const cases: Array<[string, Scenario]> = [
			['S2-L1', factory],
			[
				'S4-L1',
				defineScenario({ id: 'padat', tiles: layout('forest', { 'S4-L1': 'dense_settlement' }) })
			],
			['S3-R2', defineScenario({ id: 'sawah', tiles: layout('forest', { 'S3-R2': 'paddy' }) })],
			[
				'S1-L2',
				defineScenario({ id: 'terbuka', tiles: layout('forest', { 'S1-L2': 'open_land' }) })
			]
		];
		for (const [tileId, scenario] of cases) {
			const from = Number(tileId.charAt(1));
			const loaded = replay(scenario, SEED, [], 24);
			loaded.snapshots.forEach((state, month) => {
				for (const item of state.segments) {
					if (item.index < from) continue;
					const reference = segment(snapshot(naturalHistory, month), item.index).pollutionIndex;
					expect(item.pollutionIndex).toBeGreaterThanOrEqual(reference - 1e-9);
				}
			});
		}
	});

	it('9. Determinisme: dua kali replay dengan masukan sama menghasilkan riwayat identik', () => {
		const actions: Action[] = [
			{ month: 2, type: 'ipal_industrial', target: 'S2-L1' },
			{ month: 5, type: 'greenbelt', target: 'S3' }
		];
		expect(replay(factory, 77, actions, 30)).toEqual(replay(factory, 77, actions, 30));
	});
});

describe('uji kalibrasi 4.15', () => {
	it('11. Sungai kaya fosfat punya selisih DO siang dan DO subuh minimal 2 mg/L; sungai bersih di bawah 0,5 mg/L', () => {
		const rich = replay(scenarios['oksigen-subuh'] ?? natural, SEED, [], 12);
		const swing = (state: SimState): number =>
			Math.max(...state.segments.map((item) => item.doDayMax - item.doDawn));
		expect(swing(snapshot(rich, AUGUST))).toBeGreaterThanOrEqual(2);
		const clean = replay(natural, SEED, [], 12);
		for (const state of clean.snapshots.slice(1)) expect(swing(state)).toBeLessThan(0.5);
	});

	it('12. Amplitudo pasang saat purnama lebih besar daripada saat kuartal', () => {
		expect(tideAmplitude(0.5)).toBeGreaterThan(tideAmplitude(0.25));
		expect(tideAmplitude(0)).toBeGreaterThan(tideAmplitude(0.75));
	});

	it('13. Tanpa SLR tidak pernah terjadi Banjir Rob', () => {
		for (let month = 1; month <= 36; month += 1) {
			const year = 2026 + Math.floor((month - 1) / 12);
			expect(isRobFlood(maxTideInMonth(year, ((month - 1) % 12) + 1, 0), false)).toBe(false);
		}
		const coastal = replay(scenarios['kota-padat'] ?? natural, SEED, [], 36);
		expect(
			coastal.snapshots.some((state) => state.events.some((event) => event.type === 'rob_flood'))
		).toBe(false);
		expect(finalState(coastal).month).toBe(36);
	});
});
