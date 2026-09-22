import { describe, expect, it } from 'vitest';
import { indicatorAtEnd, target } from './evaluate';
import { measureDecisionImpact } from './impact';
import { replay } from './replay';
import { scenarios, tileOrder } from './scenarios';
import type { Action, MissionDefinition } from './types';

const scenario = scenarios['lima-tahun'];
const MONTHS = 60;
const ACTION_COUNT = 20;
const REPLAY_BUDGET_MS = 20;
const IMPACT_BUDGET_MS = 500;

const actions: Action[] = Array.from({ length: ACTION_COUNT }, (_, i): Action => {
	const tile = tileOrder[(i * 5) % tileOrder.length] ?? 'S1-L1';
	const types: Action['type'][] = [
		'plant_forest',
		'biopori',
		'greenbelt',
		'river_cleanup',
		'waste_bank'
	];
	const type = types[i % types.length] ?? 'river_cleanup';
	const target = type === 'greenbelt' || type === 'river_cleanup' ? `S${(i % 6) + 1}` : tile;
	return { month: i + 1, type, target };
});

const mission: MissionDefinition = {
	id: 'performa',
	months: MONTHS,
	targets: [target('banjir', 1, indicatorAtEnd('floodRisk', 'max', 50))]
};

function fastest(times: number, work: () => void): number {
	let best = Number.POSITIVE_INFINITY;
	for (let i = 0; i < times; i += 1) {
		const start = performance.now();
		work();
		best = Math.min(best, performance.now() - start);
	}
	return best;
}

describe('anggaran performa mesin', () => {
	if (!scenario) throw new Error('skenario lima-tahun tidak ada');

	it('menyelesaikan 60 bulan simulasi di bawah 20 ms', () => {
		replay(scenario, 1, actions, MONTHS);
		expect(fastest(3, () => replay(scenario, 1, actions, MONTHS))).toBeLessThan(REPLAY_BUDGET_MS);
	});

	it('menghitung measureDecisionImpact untuk 20 aksi di bawah 500 ms', () => {
		expect(fastest(2, () => measureDecisionImpact(scenario, 1, actions, mission))).toBeLessThan(
			IMPACT_BUDGET_MS
		);
	});
});
