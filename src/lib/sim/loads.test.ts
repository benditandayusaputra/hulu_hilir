import { describe, expect, it } from 'vitest';
import { landUseSpecs } from './constants';
import {
	baseLoadOf,
	hasActive,
	loadEntries,
	runoffOf,
	sumBySegment,
	tileLoad,
	tileSource,
	type LoadContext
} from './loads';
import type { TileState } from './types';

function tile(overrides: Partial<TileState>): TileState {
	return {
		id: 'S2-L1',
		segment: 2,
		side: 'L',
		position: 1,
		landUse: 'factory',
		forestMaturity: 1,
		interventions: [],
		...overrides
	};
}

function context(overrides: Partial<LoadContext> = {}): LoadContext {
	return {
		month: 5,
		tssRainFactor: 1,
		upkeepPaid: true,
		greenbeltMaturity: [0, 0, 0, 0, 0, 0],
		events: [],
		sealedSegments: new Set(),
		...overrides
	};
}

describe('beban petak', () => {
	it('mengambil beban pabrik apa adanya dan mengalikan TSS dengan faktor hujan', () => {
		const load = tileLoad(tile({}), context({ tssRainFactor: 2 }));
		expect(load.bod).toBe(landUseSpecs.factory.bod);
		expect(load.tss).toBe(landUseSpecs.factory.tss * 2);
	});

	it('mencampur hutan muda antara lahan terbuka dan hutan matang', () => {
		const young = baseLoadOf('forest', 0.5);
		expect(young.tss).toBeCloseTo((landUseSpecs.open_land.tss + landUseSpecs.forest.tss) / 2);
		expect(baseLoadOf('forest', 0).tss).toBe(landUseSpecs.open_land.tss);
		expect(runoffOf(tile({ landUse: 'forest', forestMaturity: 0 }), 1, true)).toBeCloseTo(0.45);
	});

	it('mengurangi beban IPAL hanya setelah aktif dan saat biaya rutin terbayar', () => {
		const withIpal = tile({ interventions: [{ type: 'ipal_industrial', activeFrom: 6 }] });
		expect(tileLoad(withIpal, context({ month: 5 })).bod).toBe(landUseSpecs.factory.bod);
		expect(tileLoad(withIpal, context({ month: 6 })).bod).toBeCloseTo(
			landUseSpecs.factory.bod * 0.15
		);
		expect(tileLoad(withIpal, context({ month: 6, upkeepPaid: false })).bod).toBe(
			landUseSpecs.factory.bod
		);
		expect(tileSource(withIpal, 6, true)).toBe('treated_factory');
		expect(tileSource(withIpal, 5, true)).toBe('factory');
		expect(hasActive(withIpal.interventions, 'ipal_industrial', 6, true)).toBe(true);
	});

	it('menggabungkan pengurangan secara perkalian dengan sabuk hijau', () => {
		const paddy = tile({
			landUse: 'paddy',
			interventions: [{ type: 'eco_farming', activeFrom: 1 }]
		});
		const load = tileLoad(paddy, context({ greenbeltMaturity: [0, 1, 0, 0, 0, 0] }));
		expect(load.nitrate).toBeCloseTo(landUseSpecs.paddy.nitrate * 0.6 * 0.8);
		expect(load.tss).toBeCloseTo(landUseSpecs.paddy.tss * 0.8 * 0.7);
	});

	it('menandai permukiman dengan IPAL komunal sebagai sumber terolah', () => {
		const village = tile({
			landUse: 'settlement',
			interventions: [{ type: 'ipal_communal', activeFrom: 1 }]
		});
		expect(tileSource(village, 2, true)).toBe('treated_settlement');
	});

	it('mengurangi C limpasan dengan biopori tanpa menjadi negatif', () => {
		const house = tile({
			landUse: 'settlement',
			interventions: [{ type: 'biopori', activeFrom: 1 }]
		});
		expect(runoffOf(house, 2, true)).toBeCloseTo(0.5);
		expect(runoffOf(house, 2, false)).toBeCloseTo(0.65);
	});

	it('menambahkan beban kejadian per segmen dan menghormati penyegelan', () => {
		const events = [
			{ type: 'illegal_dumping' as const, month: 5, segment: 2 as const, value: 0 },
			{ type: 'landslide' as const, month: 5, segment: 3 as const, value: 0 },
			{ type: 'heavy_rain' as const, month: 5, segment: null, value: 40 }
		];
		const entries = loadEntries([tile({})], context({ events, sealedSegments: new Set([2]) }));
		const dumping = entries.find((entry) => entry.source === 'illegal_dumping');
		const slide = entries.find((entry) => entry.source === 'landslide');
		expect(dumping?.load.bod).toBeCloseTo(600 * 0.3);
		expect(slide?.load.tss).toBe(60000);
		const totals = sumBySegment(entries);
		expect(totals[1]?.bod).toBeCloseTo(landUseSpecs.factory.bod + 180);
		expect(totals[2]?.tss).toBe(60000);
	});
});
