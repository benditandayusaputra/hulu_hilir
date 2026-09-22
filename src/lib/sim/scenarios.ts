import { fullMoonDay } from './daily';
import {
	segmentIndices,
	tilePositions,
	tileSides,
	type LandUse,
	type Scenario,
	type SegmentIndex,
	type TileId
} from './types';

export const tileOrder: readonly TileId[] = segmentIndices.flatMap((segment) =>
	tileSides.flatMap((side) =>
		tilePositions.map((position): TileId => `S${segment}-${side}${position}`)
	)
);

export const defaultStartDate = { year: 2026, month: 1, day: 1 };

export function layout(base: LandUse, overrides: Partial<Record<TileId, LandUse>> = {}): LandUse[] {
	return tileOrder.map((id) => overrides[id] ?? base);
}

export function fillSegments(
	base: LandUse,
	bySegment: Partial<Record<SegmentIndex, LandUse>>,
	overrides: Partial<Record<TileId, LandUse>> = {}
): LandUse[] {
	return tileOrder.map((id, i) => {
		const segment = segmentIndices[Math.floor(i / 4)];
		const fromSegment = segment === undefined ? undefined : bySegment[segment];
		return overrides[id] ?? fromSegment ?? base;
	});
}

export function defineScenario(
	partial: Partial<Scenario> & { id: string; tiles: readonly LandUse[] }
): Scenario {
	return {
		startDate: defaultStartDate,
		budget: null,
		seaLevelRise: 0,
		scheduledEvents: [],
		segmentOverrides: {},
		mission: false,
		...partial
	};
}

const village: Partial<Record<TileId, LandUse>> = {
	'S3-L1': 'settlement',
	'S3-L2': 'paddy',
	'S3-R1': 'paddy',
	'S2-R2': 'paddy'
};

const ROB_EXTREME_RAIN_MONTH = 13;
const ROB_SEA_LEVEL_RISE = 0.3;
const OXYGEN_HYACINTH_START = 0.4;

export const scenarios: Record<string, Scenario> = {
	alami: defineScenario({ id: 'alami', tiles: layout('forest') }),
	desa: defineScenario({ id: 'desa', tiles: layout('forest', village) }),
	'kota-padat': defineScenario({
		id: 'kota-padat',
		tiles: fillSegments('forest', { 4: 'dense_settlement', 5: 'dense_settlement', 6: 'settlement' })
	}),
	'lahan-kosong': defineScenario({ id: 'lahan-kosong', tiles: layout('open_land') }),
	demo: defineScenario({
		id: 'demo',
		tiles: layout('forest', { ...village, 'S4-L1': 'settlement', 'S4-R1': 'settlement' }),
		scheduledEvents: [{ month: 2, type: 'extreme_rain' }]
	}),
	kenalan: defineScenario({
		id: 'kenalan',
		tiles: layout('forest', village),
		budget: { initial: 10, monthly: 0.5 },
		mission: true
	}),
	'hulu-gundul': defineScenario({
		id: 'hulu-gundul',
		tiles: fillSegments('forest', {
			1: 'open_land',
			2: 'open_land',
			4: 'settlement',
			5: 'settlement'
		}),
		budget: { initial: 20, monthly: 0.5 },
		scheduledEvents: [{ month: 14, type: 'extreme_rain' }],
		mission: true
	}),
	'pabrik-tepi-kali': defineScenario({
		id: 'pabrik-tepi-kali',
		tiles: layout('forest', { ...village, 'S2-L1': 'factory', 'S3-R2': 'factory' }),
		budget: { initial: 18, monthly: 0.4 },
		scheduledEvents: [{ month: 7, type: 'drought' }],
		mission: true
	}),
	'kali-kota': defineScenario({
		id: 'kali-kota',
		tiles: fillSegments('forest', {
			4: 'dense_settlement',
			5: 'dense_settlement',
			6: 'dense_settlement'
		}),
		budget: { initial: 30, monthly: 0.6 },
		scheduledEvents: [{ month: 3, type: 'heavy_rain' }],
		mission: true
	}),
	'lima-tahun': defineScenario({
		id: 'lima-tahun',
		tiles: fillSegments(
			'forest',
			{ 1: 'open_land', 3: 'paddy', 4: 'dense_settlement', 5: 'settlement', 6: 'settlement' },
			{ 'S2-L1': 'factory', 'S2-R1': 'open_land', 'S5-L1': 'dense_settlement' }
		),
		budget: { initial: 40, monthly: 0.8 },
		scheduledEvents: [
			{ month: 20, type: 'drought' },
			{ month: 33, type: 'illegal_dumping', segment: 2 },
			{ month: 38, type: 'extreme_rain' }
		],
		mission: true
	}),
	'oksigen-subuh': defineScenario({
		id: 'oksigen-subuh',
		tiles: fillSegments(
			'forest',
			{ 3: 'paddy', 4: 'paddy', 5: 'paddy', 6: 'paddy' },
			{ 'S4-L1': 'dense_settlement', 'S5-L1': 'dense_settlement', 'S6-L1': 'dense_settlement' }
		),
		budget: { initial: 20, monthly: 0.4 },
		scheduledEvents: [{ month: 8, type: 'drought' }],
		segmentOverrides: {
			4: { hyacinth: OXYGEN_HYACINTH_START },
			5: { hyacinth: OXYGEN_HYACINTH_START },
			6: { hyacinth: OXYGEN_HYACINTH_START }
		},
		mission: true
	}),
	'rob-muara': defineScenario({
		id: 'rob-muara',
		tiles: fillSegments('forest', { 5: 'dense_settlement', 6: 'dense_settlement' }),
		budget: { initial: 35, monthly: 0.6 },
		seaLevelRise: ROB_SEA_LEVEL_RISE,
		scheduledEvents: [
			{
				month: ROB_EXTREME_RAIN_MONTH,
				type: 'extreme_rain',
				day: fullMoonDay(defaultStartDate.year + 1, 1)
			}
		],
		mission: true
	})
};

export function scenarioById(id: string): Scenario | null {
	return scenarios[id] ?? null;
}
