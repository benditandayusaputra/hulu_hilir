import { describe, expect, it } from 'vitest';
import {
	applyAction,
	buildCostOf,
	isTileId,
	parseSegmentIndex,
	segmentsTargetedBy,
	settleRelocations
} from './actions';
import { defineScenario, layout, scenarios } from './scenarios';
import { createInitialState } from './state';
import type { Action, SimState } from './types';

const factoryScenario = defineScenario({
	id: 'uji-pabrik',
	tiles: layout('forest', { 'S2-L1': 'factory', 'S3-L1': 'dense_settlement', 'S3-R1': 'paddy' }),
	budget: { initial: 20, monthly: 0.5 },
	mission: true
});

function act(type: Action['type'], target: string, choice?: string): Action {
	return choice === undefined ? { month: 1, type, target } : { month: 1, type, target, choice };
}

function expectOk(state: SimState, action: Action): SimState {
	const result = applyAction(state, action);
	if (!result.ok) throw new Error(`aksi ditolak: ${result.error.code}`);
	return result.value;
}

function expectError(state: SimState, action: Action, code: string): void {
	const result = applyAction(state, action);
	expect(result.ok).toBe(false);
	if (!result.ok) expect(result.error.code).toBe(code);
}

describe('aksi pemain', () => {
	const start = createInitialState(factoryScenario, 1);

	it('mengurai target petak, segmen, dan sungai', () => {
		expect(isTileId('S3-L1')).toBe(true);
		expect(isTileId('S7-L1')).toBe(false);
		expect(parseSegmentIndex('S4')).toBe(4);
		expect(parseSegmentIndex('4')).toBe(4);
		expect(parseSegmentIndex('S9')).toBeNull();
	});

	it('memasang IPAL Industri dengan jeda dua bulan dan memotong kas', () => {
		const next = expectOk(start, act('ipal_industrial', 'S2-L1'));
		const tile = next.tiles.find((item) => item.id === 'S2-L1');
		expect(tile?.interventions).toEqual([{ type: 'ipal_industrial', activeFrom: 3 }]);
		expect(next.cash).toBeCloseTo(12);
		expectError(next, act('ipal_industrial', 'S2-L1'), 'already_installed');
	});

	it('menolak aksi yang tidak cocok dengan penggunaan lahan atau target salah', () => {
		expectError(start, act('ipal_industrial', 'S3-L1'), 'incompatible_land_use');
		expectError(start, act('ipal_industrial', 'S9-L1'), 'invalid_target');
		expectError(start, act('floodgate', 'S3'), 'invalid_target');
		expectError(start, act('greenbelt', 'S9'), 'invalid_target');
		expectError(start, act('enforcement', 'S1'), 'invalid_target');
		expectError(
			start,
			{ month: 1, type: 'terbang' as Action['type'], target: 'S1' },
			'unknown_action'
		);
	});

	it('menolak aksi yang membuat kas negatif dan membebaskan Lab tanpa anggaran', () => {
		expectError({ ...start, cash: 5 }, act('relocation', 'S2-L1'), 'insufficient_cash');
		const lab = createInitialState(scenarios['alami'] ?? factoryScenario, 1);
		expect(expectOk(lab, act('greenbelt', 'S1')).cash).toBeNull();
	});

	it('memakai biaya IPAL komunal padat dan hanya mengizinkan ubah lahan di Lab', () => {
		expect(buildCostOf('ipal_communal', 'dense_settlement')).toBe(12);
		expect(buildCostOf('ipal_communal', 'settlement')).toBe(6);
		expectError(start, act('change_land_use', 'S1-L1', 'paddy'), 'lab_only');
		const lab = createInitialState({ ...factoryScenario, mission: false }, 1);
		const changed = expectOk(lab, act('change_land_use', 'S1-L1', 'paddy'));
		expect(changed.tiles[0]?.landUse).toBe('paddy');
		expectError(lab, act('change_land_use', 'S1-L1', 'mall'), 'invalid_target');
	});

	it('menanam hutan muda di sawah dan memasang intervensi segmen serta sungai', () => {
		let next = expectOk(start, act('plant_forest', 'S3-R1'));
		expect(next.tiles.find((tile) => tile.id === 'S3-R1')?.forestMaturity).toBe(0);
		next = expectOk(next, act('greenbelt', 'S3'));
		expect(next.segments[2]?.interventions).toEqual([{ type: 'greenbelt', activeFrom: 1 }]);
		expectError(next, act('greenbelt', 'S3'), 'already_installed');
		next = expectOk(next, act('enforcement', 'river'));
		expect(next.riverInterventions).toHaveLength(1);
		expectError(next, act('enforcement', 'river'), 'already_installed');
		next = expectOk(next, act('floodgate', 'S6'));
		expect(next.segments[5]?.interventions[0]?.activeFrom).toBe(7);
	});

	it('membongkar intervensi tanpa pengembalian biaya', () => {
		let next = expectOk(start, act('waste_bank', 'S3-L1'));
		next = expectOk(next, act('greenbelt', 'S3'));
		next = expectOk(next, act('enforcement', 'river'));
		const cashBefore = next.cash;
		next = expectOk(next, act('dismantle', 'S3-L1', 'waste_bank'));
		next = expectOk(next, act('dismantle', 'S3', 'greenbelt'));
		next = expectOk(next, act('dismantle', 'river', 'enforcement'));
		expect(next.cash).toBe(cashBefore);
		expect(next.tiles.find((tile) => tile.id === 'S3-L1')?.interventions).toEqual([]);
		expect(next.segments[2]?.interventions).toEqual([]);
		expect(next.riverInterventions).toEqual([]);
		expectError(next, act('dismantle', 'S3-L1', 'waste_bank'), 'nothing_to_dismantle');
		expectError(next, act('dismantle', 'S3', 'greenbelt'), 'nothing_to_dismantle');
		expectError(next, act('dismantle', 'river', 'enforcement'), 'nothing_to_dismantle');
		expectError(next, act('dismantle', 'S9', 'greenbelt'), 'invalid_target');
		expectError(next, act('dismantle', 'S3', 'pesawat'), 'invalid_target');
	});

	it('mengubah pabrik menjadi lahan terbuka saat relokasi jatuh tempo', () => {
		const rich = { ...start, cash: 100 };
		const next = expectOk(rich, act('relocation', 'S2-L1'));
		expect(settleRelocations(next.tiles, 6).find((tile) => tile.id === 'S2-L1')?.landUse).toBe(
			'factory'
		);
		const settled = settleRelocations(next.tiles, 7).find((tile) => tile.id === 'S2-L1');
		expect(settled?.landUse).toBe('open_land');
		expect(settled?.interventions).toEqual([]);
	});

	it('mengumpulkan segmen sasaran aksi instan', () => {
		const targets = segmentsTargetedBy(
			[act('dredging', 'S2'), act('dredging', 'S9'), act('river_cleanup', 'S3')],
			'dredging'
		);
		expect([...targets]).toEqual([2]);
	});
});
