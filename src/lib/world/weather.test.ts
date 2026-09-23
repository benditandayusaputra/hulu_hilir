import { describe, expect, it } from 'vitest';
import {
	createInitialState,
	landUseSpecs,
	scenarioById,
	type EventType,
	type SimState
} from '$lib/sim';
import { riverLength, slice } from './layout';
import {
	rainOf,
	runoffMarks,
	soakMarks,
	splashPoints,
	weatherKindOf,
	weatherKinds,
	weatherScene
} from './weather';

function initial(id: string): SimState {
	const scenario = scenarioById(id);
	if (scenario === null) throw new Error(`scenario ${id} missing`);
	return createInitialState(scenario, 2026);
}

function withEvents(state: SimState, types: readonly EventType[]): SimState {
	return {
		...state,
		events: types.map((type) => ({ type, month: 1, segment: null, value: 0 }))
	};
}

const countRanges = {
	drought: [0, 1],
	clear: [2, 3],
	cloudy: [4, 5],
	heavy: [6, 8],
	extreme: [10, 12]
} as const;

describe('keadaan cuaca dunia', () => {
	it('mendahulukan hujan ekstrem, hujan lebat, kemarau, lalu musim', () => {
		const state = initial('desa');
		expect(weatherKindOf(withEvents(state, ['heavy_rain', 'extreme_rain']), 'dry')).toBe('extreme');
		expect(weatherKindOf(withEvents(state, ['heavy_rain']), 'wet')).toBe('heavy');
		expect(weatherKindOf({ ...state, droughtActive: true }, 'wet')).toBe('drought');
		expect(weatherKindOf(state, 'dry')).toBe('drought');
		expect(weatherKindOf(state, 'wet')).toBe('cloudy');
		expect(weatherKindOf(state, 'transition')).toBe('clear');
		expect(weatherKindOf(withEvents(state, ['landslide']), 'transition')).toBe('clear');
	});

	it('bulan 2 skenario demo selalu hujan ekstrem', () => {
		const demo = scenarioById('demo');
		expect(demo?.scheduledEvents).toContainEqual({ month: 2, type: 'extreme_rain' });
	});

	it('jumlah awan mengikuti tabel 8.8 dan Dunia Ringan memakai separuhnya', () => {
		for (const kind of weatherKinds) {
			const [min, max] = countRanges[kind];
			const full = weatherScene(kind, 'full').clouds.length;
			expect(full).toBeGreaterThanOrEqual(min);
			expect(full).toBeLessThanOrEqual(max);
			expect(weatherScene(kind, 'light').clouds.length).toBe(Math.ceil(full / 2));
		}
	});

	it('hujan turun dari perut setiap awan hujan sampai ke tanah, dan cuaca kering tanpa hujan', () => {
		for (const kind of weatherKinds) {
			const scene = weatherScene(kind, 'full');
			expect(scene.rain).toBe(rainOf(kind));
			for (const cloud of scene.clouds) {
				if (scene.rain === null) {
					expect(cloud.rain).toBeNull();
					continue;
				}
				const column = cloud.rain ?? [];
				expect(column).toHaveLength(4);
				expect(Math.min(...column.map((point) => point.y))).toBeGreaterThan(cloud.cloud.y);
				expect(Math.max(...column.map((point) => point.y))).toBe(cloud.ground.y);
				expect(cloud.shadow.x + cloud.shadow.width / 2).toBeGreaterThan(cloud.ground.x);
				expect(cloud.shadow.y + cloud.shadow.height / 2).toBeGreaterThan(cloud.ground.y);
			}
			expect(scene.rainBounds === null).toBe(scene.rain === null);
		}
	});

	it('hujan ekstrem miring karena angin, hujan lebat tegak lurus', () => {
		const [heavy] = weatherScene('heavy', 'full').clouds;
		const [extreme] = weatherScene('extreme', 'full').clouds;
		const heavyColumn = heavy?.rain ?? [];
		const extremeColumn = extreme?.rain ?? [];
		expect(heavyColumn[3]?.x).toBe(heavyColumn[0]?.x);
		expect(extremeColumn[3]?.x ?? 0).toBeGreaterThan(extremeColumn[0]?.x ?? 0);
	});

	it('awan hujan lebat paling rapat di hulu', () => {
		const clouds = weatherScene('heavy', 'full').clouds;
		const upstream = slice(0, riverLength / 2);
		const inUpstream = clouds.filter((cloud) =>
			upstream.some(
				(point) =>
					Math.hypot(point.x - cloud.ground.x, point.y - cloud.ground.y) < 100 &&
					point.y <= cloud.ground.y + 100
			)
		);
		expect(inUpstream.length).toBeGreaterThan(clouds.length / 2);
	});

	it('peredupan dan rona hangat sesuai tabel 8.8', () => {
		expect(weatherScene('heavy', 'full').dim).toBe(0.12);
		expect(weatherScene('extreme', 'full').dim).toBe(0.22);
		expect(weatherScene('drought', 'full').tint).toBe(0.06);
		expect(weatherScene('clear', 'full').dim).toBe(0);
	});
});

describe('limpasan dan resapan', () => {
	it('limpasan hanya dari lahan bukan hutan dengan tebal sebanding koefisien limpasan', () => {
		const base = initial('desa');
		const tiles = base.tiles.map((tile) =>
			tile.id === 'S2-L1' ? { ...tile, landUse: 'factory' as const } : tile
		);
		const marks = runoffMarks({ ...base, tiles });
		const factory = marks.filter((mark) => mark.key.startsWith('S2-L1-'));
		const paddy = marks.filter((mark) => mark.key.startsWith('S3-L2-'));
		expect(factory).toHaveLength(3);
		expect(paddy).toHaveLength(3);
		expect(marks.some((mark) => mark.key.startsWith('S1-'))).toBe(false);
		const ratio = (factory[0]?.width ?? 0) / (paddy[0]?.width ?? 1);
		expect(ratio).toBeCloseTo(landUseSpecs.factory.runoff / landUseSpecs.paddy.runoff, 5);
	});

	it('hutan matang dan sabuk hijau aktif menampilkan tetes yang meresap', () => {
		const forest = initial('alami');
		expect(soakMarks(forest)).toHaveLength(forest.tiles.length * 3);
		const young = forest.tiles.map((tile) =>
			tile.id === 'S1-L1' ? { ...tile, forestMaturity: 0.2 } : tile
		);
		expect(soakMarks({ ...forest, tiles: young })).toHaveLength((forest.tiles.length - 1) * 3);
		const bare = initial('lahan-kosong');
		expect(soakMarks(bare)).toHaveLength(0);
		const segments = bare.segments.map((segment) =>
			segment.index === 4
				? { ...segment, interventions: [{ type: 'greenbelt' as const, activeFrom: 0 }] }
				: segment
		);
		const banks = soakMarks({ ...bare, segments });
		expect(banks).toHaveLength(6);
		expect(banks.every((mark) => mark.key.startsWith('bank-4'))).toBe(true);
		const building = bare.segments.map((segment) =>
			segment.index === 4
				? { ...segment, interventions: [{ type: 'greenbelt' as const, activeFrom: 5 }] }
				: segment
		);
		expect(soakMarks({ ...bare, segments: building })).toHaveLength(0);
		expect(splashPoints().length).toBeGreaterThan(0);
	});
});
