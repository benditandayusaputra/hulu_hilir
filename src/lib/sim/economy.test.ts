import { describe, expect, it } from 'vitest';
import {
	economyOf,
	economyScore,
	finesOf,
	monthlyUpkeep,
	settleCash,
	untreatedFactories,
	upkeepOf,
	type EconomyInput
} from './economy';
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
		forestMaturity: 1,
		interventions
	};
}

function input(tiles: TileState[], overrides: Partial<EconomyInput> = {}): EconomyInput {
	return {
		tiles,
		month: 3,
		upkeepPaid: true,
		ecotourism: new Set(),
		failedPaddies: new Set(),
		...overrides
	};
}

describe('ekonomi dan kas', () => {
	it('menjumlahkan pendapatan dan lapangan kerja tiap petak', () => {
		const economy = economyOf(input([tile(1, 'factory'), tile(1, 'paddy'), tile(2, 'forest')]));
		expect(economy.revenue).toBeCloseTo(1.2 + 0.3 + 0.05);
		expect(economy.jobs).toBe(800 + 150 + 20);
	});

	it('menambah ekowisata, menghapus pendapatan sawah gagal panen, dan memotong pertanian ramah', () => {
		const eco = tile(2, 'paddy', [{ type: 'eco_farming', activeFrom: 1 }]);
		const economy = economyOf(
			input([tile(1, 'forest'), tile(3, 'paddy'), eco], {
				ecotourism: new Set([1]),
				failedPaddies: new Set([3])
			})
		);
		expect(economy.revenue).toBeCloseTo(0.35 + 0 + 0.27);
		expect(economy.jobs).toBe(70 + 150 + 150);
	});

	it('menghitung indikator Ekonomi Warga terhadap kondisi awal dan menahan pembagi nol', () => {
		const baseline = { revenue: 10, jobs: 1000 };
		expect(economyScore({ revenue: 10, jobs: 1000 }, baseline, 0, false)).toBeCloseTo(100);
		expect(economyScore({ revenue: 5, jobs: 500 }, baseline, 0, false)).toBeCloseTo(50);
		expect(economyScore({ revenue: 10, jobs: 1000 }, baseline, 2, true)).toBeCloseTo(96);
		expect(economyScore({ revenue: 0, jobs: 0 }, { revenue: 0, jobs: 0 }, 0, false)).toBeCloseTo(
			100
		);
	});

	it('menghitung pabrik tanpa IPAL dan dendanya saat pengawasan aktif', () => {
		const treated = tile(2, 'factory', [{ type: 'ipal_industrial', activeFrom: 2 }]);
		const tiles = [tile(1, 'factory'), treated, tile(3, 'settlement')];
		expect(untreatedFactories(tiles, 3, true)).toBe(1);
		expect(untreatedFactories(tiles, 1, true)).toBe(2);
		expect(finesOf(2, true)).toBeCloseTo(0.6);
		expect(finesOf(2, false)).toBe(0);
	});

	it('menjumlahkan biaya rutin intervensi aktif termasuk IPAL komunal padat', () => {
		const dense = tile(4, 'dense_settlement', [{ type: 'ipal_communal', activeFrom: 1 }]);
		const village = tile(4, 'settlement', [{ type: 'ipal_communal', activeFrom: 9 }]);
		expect(upkeepOf({ type: 'ipal_communal', activeFrom: 1 }, dense)).toBe(0.2);
		const total = monthlyUpkeep(
			[dense, village],
			[[{ type: 'greenbelt', activeFrom: 1 }], []],
			[{ type: 'enforcement', activeFrom: 1 }],
			3
		);
		expect(total).toBeCloseTo(0.2 + 0.02 + 0.1);
	});

	it('membayar biaya rutin bila kas cukup dan menandai gagal bayar bila tidak', () => {
		expect(settleCash(10, 0.5, 0.3, 1)).toEqual({ cash: 9.8, received: 0.8, upkeepPaid: true });
		expect(settleCash(0.1, 0.5, 0, 1)).toEqual({ cash: 0.6, received: 0.5, upkeepPaid: false });
		expect(settleCash(null, 0.5, 0, 1)).toEqual({ cash: null, received: 0, upkeepPaid: true });
	});
});
