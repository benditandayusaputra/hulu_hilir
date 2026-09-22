import { describe, expect, it } from 'vitest';
import { attributeCauses } from './causes';
import { finalState, replay } from './replay';
import { defineScenario, layout } from './scenarios';
import { createInitialState } from './state';

const factory = defineScenario({
	id: 'sebab',
	tiles: layout('forest', { 'S2-L1': 'factory', 'S4-L1': 'dense_settlement' })
});

describe('atribusi sebab beban', () => {
	it('menunjuk pabrik sebagai sumber utama BOD dan Cr VI di hilirnya', () => {
		const state = finalState(replay(factory, 1, [], 8));
		const report = attributeCauses(state, 3);
		expect(report.bod[0]?.source).toBe('factory');
		expect(report.bod[0]?.segment).toBe(2);
		expect(report.chromium.map((share) => share.source)).toContain('factory');
		expect(report.chromium.map((share) => share.source)).toContain('illegal_dumping');
		const total = report.bod.reduce((sum, share) => sum + share.share, 0);
		expect(total).toBeCloseTo(1);
		expect(report.bod.some((share) => share.source === 'background')).toBe(true);
	});

	it('mengabaikan sumber di hilir segmen yang ditanya dan menandai IPAL sebagai sumber terolah', () => {
		const state = finalState(
			replay(factory, 1, [{ month: 1, type: 'ipal_industrial', target: 'S2-L1' }], 8)
		);
		const upstream = attributeCauses(state, 2);
		expect(upstream.fecalColiform.some((share) => share.source === 'dense_settlement')).toBe(false);
		expect(upstream.bod.some((share) => share.source === 'treated_factory')).toBe(true);
		const downstream = attributeCauses(state, 5);
		expect(downstream.fecalColiform[0]?.source).toBe('dense_settlement');
	});

	it('memberi latar sebagai satu-satunya sumber Cr VI di sungai tanpa pabrik', () => {
		const state = createInitialState(defineScenario({ id: 'bersih', tiles: layout('forest') }), 1);
		const report = attributeCauses(state, 6);
		expect(report.chromium).toEqual([]);
		expect(report.bod.filter((share) => share.source === 'forest')).toHaveLength(6);
	});
});
