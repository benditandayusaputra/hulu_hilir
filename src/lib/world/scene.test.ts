import { describe, expect, it } from 'vitest';
import {
	factory,
	forestStages,
	paddyStages,
	props,
	waterItems
} from '$lib/components/world/art/symbols';
import {
	createInitialState,
	scenarioById,
	waterStatuses,
	type SegmentState,
	type TileState
} from '$lib/sim';
import { assetOf, buildProgress, plotViews, segmentObjects, waterItemsOf } from './scene';

function initial() {
	const scenario = scenarioById('desa');
	if (scenario === null) throw new Error('scenario missing');
	return createInitialState(scenario, 2026);
}

function tile(overrides: Partial<TileState>): TileState {
	return {
		id: 'S2-L1',
		segment: 2,
		side: 'L',
		position: 1,
		landUse: 'forest',
		forestMaturity: 1,
		interventions: [],
		...overrides
	};
}

describe('adegan Dunia Sungai', () => {
	it('memilih aset sesuai penggunaan lahan, tahap hutan, dan musim panen', () => {
		expect(assetOf(tile({ forestMaturity: 0.1 }), 1)).toBe(forestStages[0]);
		expect(assetOf(tile({ forestMaturity: 1 }), 1)).toBe(forestStages[3]);
		expect(assetOf(tile({ landUse: 'paddy' }), 1)).toBe(paddyStages.planted);
		expect(assetOf(tile({ landUse: 'paddy' }), 4)).toBe(paddyStages.harvest);
		expect(assetOf(tile({ landUse: 'factory' }), 1)).toBe(factory);
	});

	it('menyusun 24 lahan dari belakang ke depan', () => {
		const views = plotViews(initial(), 1);
		expect(views).toHaveLength(24);
		for (let i = 1; i < views.length; i += 1) {
			expect(views[i]?.center.y).toBeGreaterThanOrEqual(views[i - 1]?.center.y ?? 0);
		}
	});

	it('intervensi petak tampil sebagai properti dengan cincin progres selama dibangun', () => {
		const state = initial();
		const factoryTile = tile({
			landUse: 'factory',
			interventions: [{ type: 'ipal_industrial', activeFrom: 3 }]
		});
		const views = plotViews({ ...state, month: 1, tiles: [factoryTile] }, 1);
		const view = views[0];
		expect(view?.props.map((item) => item.href)).toEqual([props.ipal.id]);
		expect(view?.rings).toHaveLength(1);
		expect(view?.chimney).not.toBeNull();
		expect(buildProgress({ type: 'ipal_industrial', activeFrom: 3 }, 3)).toBeNull();
	});

	it('sabuk hijau dan kolam retensi muncul di segmennya', () => {
		const state = initial();
		const segments = state.segments.map((segment): SegmentState =>
			segment.index === 3
				? {
						...segment,
						interventions: [
							{ type: 'greenbelt', activeFrom: 0 },
							{ type: 'retention_pond', activeFrom: 0 }
						]
					}
				: segment
		);
		const objects = segmentObjects({ ...state, month: 2, segments });
		expect(objects.bank.length).toBeGreaterThan(4);
		expect(objects.structures).toHaveLength(1);
		expect(objects.rings).toHaveLength(0);
	});

	it('air tercemar selalu membawa tanda benda, bukan hanya warna', () => {
		const segment = initial().segments[1];
		if (segment === undefined) throw new Error('segment missing');
		for (const status of waterStatuses) {
			const items = waterItemsOf({ ...segment, status, litter: 0, hyacinth: 0 }, 'light');
			const markers = items.filter((item) => item.marker);
			if (status === 'good') expect(markers).toHaveLength(0);
			else expect(markers.length, status).toBeGreaterThan(0);
		}
		const heavy = waterItemsOf({ ...segment, status: 'heavy', litter: 0 }, 'full').map(
			(item) => item.href
		);
		expect(heavy).toContain(waterItems.deadFish);
		expect(heavy).toContain(waterItems.sludge);
	});
});
