import { describe, expect, it } from 'vitest';
import { indicatorAtEnd, segmentsStatusAtLeast, target } from './evaluate';
import { measureDecisionImpact } from './impact';
import { replay } from './replay';
import { defineScenario, layout } from './scenarios';
import type { Action, MissionDefinition } from './types';

const factory = defineScenario({
	id: 'dampak',
	tiles: layout('forest', { 'S2-L1': 'factory' }),
	budget: { initial: 30, monthly: 0.5 },
	mission: true
});

const mission: MissionDefinition = {
	id: 'dampak',
	months: 8,
	targets: [
		target('hilir', 1, segmentsStatusAtLeast([3, 4, 5, 6], 'good')),
		target('ekonomi', 2, indicatorAtEnd('economy', 'min', 90))
	]
};

describe('dampak keputusan', () => {
	it('mengukur kontribusi tiap aksi lewat replay tanpa aksi itu', () => {
		const actions: Action[] = [
			{ month: 1, type: 'ipal_industrial', target: 'S2-L1' },
			{ month: 2, type: 'river_cleanup', target: 'S3' }
		];
		const impacts = measureDecisionImpact(factory, 4, actions, mission);
		expect(impacts).toHaveLength(2);
		expect(impacts[0]?.action.type).toBe('ipal_industrial');
		expect(impacts[0]?.scoreDelta).toBeGreaterThan(0);
		expect(impacts[0]?.indicatorDeltas.waterQuality).toBeGreaterThan(0);
		expect(Math.abs(impacts[1]?.scoreDelta ?? 1)).toBeLessThanOrEqual(
			Math.abs(impacts[0]?.scoreDelta ?? 0)
		);
	});

	it('mengembalikan daftar kosong tanpa aksi', () => {
		expect(measureDecisionImpact(factory, 4, [], mission)).toEqual([]);
	});
});

describe('replay', () => {
	it('menghasilkan riwayat identik untuk masukan yang sama', () => {
		const actions: Action[] = [{ month: 3, type: 'greenbelt', target: 'S2' }];
		const first = replay(factory, 9, actions, 15);
		const second = replay(factory, 9, actions, 15);
		expect(first.snapshots).toHaveLength(16);
		expect(first).toEqual(second);
		expect(first.snapshots[3]?.actions).toEqual([actions[0]]);
	});
});
