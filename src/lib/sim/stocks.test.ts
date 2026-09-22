import { describe, expect, it } from 'vitest';
import {
	litterInputOf,
	matureForest,
	matureGreenbelt,
	updateHyacinth,
	updateLitter,
	updateSediment
} from './stocks';
import type { TileState } from './types';

function tile(
	segment: 1 | 2 | 3 | 4 | 5 | 6,
	landUse: TileState['landUse'],
	interventions: TileState['interventions'] = []
): TileState {
	return {
		id: 'S1-L1',
		segment,
		side: 'L',
		position: 1,
		landUse,
		forestMaturity: 0,
		interventions
	};
}

describe('stok yang berubah perlahan', () => {
	it('menambah sedimen dari pengendapan, banjir, dan longsor lalu menahannya di rentang', () => {
		const base = {
			settledTss: 50,
			flowFactor: 1,
			flooded: false,
			landslide: false,
			dredged: false
		};
		expect(updateSediment(0.5, base)).toBeCloseTo(0.51);
		expect(updateSediment(0.5, { ...base, flooded: true, landslide: true })).toBeCloseTo(0.66);
		expect(updateSediment(0.5, { ...base, settledTss: 0, flowFactor: 1.6 })).toBeCloseTo(0.48);
		expect(updateSediment(0.5, { ...base, settledTss: 0, dredged: true })).toBe(0);
		expect(updateSediment(1, { ...base, landslide: true })).toBe(1);
	});

	it('mengalikan sampah masuk 0,3 bila ada bank sampah aktif', () => {
		expect(litterInputOf(tile(1, 'settlement'), 1, true)).toBe(3);
		expect(litterInputOf(tile(1, 'dense_settlement'), 1, true)).toBe(8);
		expect(
			litterInputOf(tile(1, 'settlement', [{ type: 'waste_bank', activeFrom: 1 }]), 1, true)
		).toBeCloseTo(0.9);
	});

	it('memindahkan 10% sampah ke hilir dan mencatat sampah ke laut dari muara', () => {
		const change = {
			month: 1,
			upkeepPaid: true,
			flooded: new Set<never>(),
			cleaned: new Set<never>(),
			community: new Set<never>()
		};
		const result = updateLitter([10, 0, 0, 0, 0, 20], [], change);
		expect(result.litter[0]).toBeCloseTo(9);
		expect(result.litter[1]).toBeCloseTo(1);
		expect(result.litter[5]).toBeCloseTo(18);
		expect(result.toSea).toBeCloseTo(2);
	});

	it('memindahkan setengah sampah saat banjir dan mengurangi kerja bakti serta komunitas', () => {
		const change = {
			month: 1,
			upkeepPaid: true,
			flooded: new Set([1 as const]),
			cleaned: new Set([2 as const]),
			community: new Set([3 as const])
		};
		const result = updateLitter([50, 50, 50, 0, 0, 0], [tile(4, 'dense_settlement')], change);
		expect(result.litter[0]).toBeCloseTo(50 * 0.4);
		expect(result.litter[1]).toBeCloseTo(10 * 0.9 + 30);
		expect(result.litter[2]).toBeCloseTo(35 * 0.9 + 1);
		expect(result.litter[3]).toBeCloseTo(8 * 0.9 + 3.5);
	});

	it('menumbuhkan eceng gondok hanya di air kaya fosfat yang lambat', () => {
		expect(updateHyacinth(0.2, 6, 0.5, false)).toBeCloseTo(0.35);
		expect(updateHyacinth(0.2, 1, 0.5, false)).toBeCloseTo(0.1);
		expect(updateHyacinth(0.2, 6, 0.1, false)).toBeCloseTo(0.1);
		expect(updateHyacinth(0.9, 6, 0.5, true)).toBeCloseTo(0.35);
		expect(updateHyacinth(0.05, 6, 0.1, false)).toBe(0);
	});

	it('mematangkan hutan dalam 30 bulan dan sabuk hijau dalam 12 bulan', () => {
		const forest = tile(1, 'forest');
		expect(matureForest(forest).forestMaturity).toBeCloseTo(1 / 30);
		const mature = { ...forest, forestMaturity: 1 };
		expect(matureForest(mature)).toBe(mature);
		expect(matureForest(tile(1, 'paddy')).forestMaturity).toBe(0);
		expect(matureGreenbelt(0, true)).toBeCloseTo(1 / 12);
		expect(matureGreenbelt(0.95, true)).toBe(1);
		expect(matureGreenbelt(0.5, false)).toBe(0);
	});
});
