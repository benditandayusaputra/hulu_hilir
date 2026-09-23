import { describe, expect, it } from 'vitest';
import { scenarioById, type Scenario } from '$lib/sim';
import {
	labSessionKey,
	labSessionSchemaVersion,
	parseLabSession,
	replayLabSession
} from './labStorage';
import { SimulationSession } from './simulation.svelte';

function scenario(id: string): Scenario {
	const found = scenarioById(id);
	if (found === null) throw new Error(`scenario ${id} missing`);
	return found;
}

function stored(extra: Record<string, unknown> = {}): Record<string, unknown> {
	return {
		schemaVersion: labSessionSchemaVersion,
		preset: 'desa',
		seed: 2026,
		month: 2,
		actions: [{ month: 1, type: 'change_land_use', target: 'S2-L1', choice: 'factory' }],
		...extra
	};
}

describe('penyimpanan sesi Lab', () => {
	it('memakai kunci per skenario', () => {
		expect(labSessionKey('kota-padat')).toBe('hh:session:lab:kota-padat');
	});

	it('menerima sesi yang utuh dan menolak versi, skenario, atau aksi yang asing', () => {
		expect(parseLabSession(stored(), 'desa')?.actions).toEqual([
			{ month: 1, type: 'change_land_use', target: 'S2-L1', choice: 'factory' }
		]);
		expect(parseLabSession(stored({ schemaVersion: 0 }), 'desa')).toBeNull();
		expect(parseLabSession(stored(), 'alami')).toBeNull();
		expect(parseLabSession(stored({ month: -1 }), 'desa')).toBeNull();
		expect(
			parseLabSession(stored({ actions: [{ month: 1, type: 'terbang', target: 'S1-L1' }] }), 'desa')
		).toBeNull();
		expect(parseLabSession('rusak', 'desa')).toBeNull();
	});

	it('memulihkan bulan, log, dan aksi yang menunggu persis seperti sesi aslinya', () => {
		const original = new SimulationSession(scenario('desa'));
		original.install({ type: 'change_land_use', choice: 'factory' }, { segment: 2, column: 1 });
		for (let i = 0; i < 4; i += 1) original.step();
		original.install({ type: 'ipal_industrial' }, { segment: 2, column: 1 });
		original.install({ type: 'greenbelt' }, { segment: 3, column: 2 });
		const saved = parseLabSession(
			JSON.parse(
				JSON.stringify({
					schemaVersion: labSessionSchemaVersion,
					preset: 'desa',
					seed: original.seed,
					month: original.month,
					actions: [...original.log, ...original.pending]
				})
			),
			'desa'
		);
		if (saved === null) throw new Error('saved session rejected');
		const replayed = replayLabSession(scenario('desa'), saved);
		const restored = new SimulationSession(scenario('alami'));
		restored.restore(replayed.snapshots, replayed.pending, saved.seed);
		expect(restored.scenario.id).toBe('desa');
		expect(restored.month).toBe(4);
		expect(restored.snapshots).toEqual(original.snapshots);
		expect(restored.log).toEqual(original.log);
		expect(restored.pending).toEqual(original.pending);
		expect(restored.state).toEqual(original.state);
	});
});
