import { clouds, cloudShadow, type CloudKind } from '$lib/components/world/art/symbols';
import type { Season, SimState } from '$lib/sim';
import { runoffOf } from '$lib/sim/loads';
import type { Rect } from './camera';
import {
	CLOUD_ALTITUDE,
	CLOUD_COUNTS,
	CLOUD_SCALES,
	CLOUD_SHADOW_OFFSET,
	DROUGHT_TINT,
	EXTREME_RAIN_SLANT,
	HEAVY_UPSTREAM_BIAS,
	RAIN_COLUMN_SHARE,
	RIVER_WIDTH,
	RUNOFF_INTO_WATER,
	RUNOFF_LENGTH,
	RUNOFF_STRANDS,
	RUNOFF_WIDTH_PER_C,
	SOAK_BANK_SHARES,
	SOAK_OFFSETS,
	SPLASH_LATERALS,
	SPLASH_SHARES,
	WEATHER_DIM
} from './constants';
import type { ResolvedDetail } from './detail';
import {
	plotById,
	pointAt,
	reachPoint,
	riverLength,
	segmentLayout,
	segments,
	slice,
	type Point,
	type SegmentLayout
} from './layout';
import { BANK_LATERAL } from './scene';

export const weatherKinds = ['clear', 'cloudy', 'heavy', 'extreme', 'drought'] as const;
export type WeatherKind = (typeof weatherKinds)[number];
export type RainKind = 'heavy' | 'extreme';

export interface WeatherCloud {
	key: string;
	kind: CloudKind;
	ground: Point;
	cloud: Rect;
	shadow: Rect;
	rain: Point[] | null;
}

export interface WeatherScene {
	kind: WeatherKind;
	rain: RainKind | null;
	clouds: WeatherCloud[];
	rainBounds: Rect | null;
	dim: number;
	tint: number;
}

export interface RunoffMark {
	key: string;
	d: string;
	width: number;
}

export interface SoakMark {
	key: string;
	x: number;
	y: number;
}

const fairSlots: readonly Point[] = [
	{ x: 1050, y: 950 },
	{ x: 2750, y: 800 },
	{ x: 1800, y: 2000 },
	{ x: 3350, y: 1350 },
	{ x: 520, y: 2350 },
	{ x: 2350, y: 2750 }
];

const stormColumns = [520, 1480, 2440, 3400];
const stormRows = [720, 1560, 2400];
const stormJitter: readonly Point[] = [
	{ x: 0, y: 0 },
	{ x: 60, y: -80 },
	{ x: -40, y: 50 },
	{ x: 30, y: -30 }
];

export function weatherKindOf(state: SimState, season: Season): WeatherKind {
	if (state.events.some((event) => event.type === 'extreme_rain')) return 'extreme';
	if (state.events.some((event) => event.type === 'heavy_rain')) return 'heavy';
	if (state.droughtActive || season === 'dry') return 'drought';
	return season === 'wet' ? 'cloudy' : 'clear';
}

export function rainOf(kind: WeatherKind): RainKind | null {
	return kind === 'heavy' || kind === 'extreme' ? kind : null;
}

function groundsOf(kind: WeatherKind): Point[] {
	const count = CLOUD_COUNTS[kind];
	if (kind === 'heavy') {
		return Array.from({ length: count }, (_, index) => {
			const share = ((index + 0.5) / count) ** HEAVY_UPSTREAM_BIAS;
			const point = pointAt(riverLength * share);
			return { x: point.x, y: point.y + (index % 2 === 0 ? -60 : 70) };
		});
	}
	if (kind === 'extreme') {
		return stormRows.flatMap((y, row) =>
			stormColumns.map((x, column) => {
				const jitter = stormJitter[(row + column) % stormJitter.length] ?? { x: 0, y: 0 };
				return { x: x + jitter.x, y: y + jitter.y };
			})
		);
	}
	const start = kind === 'drought' ? 1 : 0;
	return fairSlots.slice(start, start + count);
}

function cloudKindOf(kind: WeatherKind): CloudKind {
	if (kind === 'extreme') return 'storm';
	if (kind === 'heavy') return 'rain';
	return kind === 'cloudy' ? 'grey' : 'white';
}

function rainColumn(ground: Point, cloud: Rect, kind: RainKind): Point[] {
	const half = cloud.width * RAIN_COLUMN_SHARE;
	const top = cloud.y + cloud.height * 0.85;
	const drift = kind === 'extreme' ? (ground.y - top) * EXTREME_RAIN_SLANT : 0;
	return [
		{ x: ground.x - half, y: top },
		{ x: ground.x + half, y: top },
		{ x: ground.x + half + drift, y: ground.y },
		{ x: ground.x - half + drift, y: ground.y }
	];
}

function boundsOf(points: readonly Point[]): Rect | null {
	if (points.length === 0) return null;
	const xs = points.map((point) => point.x);
	const ys = points.map((point) => point.y);
	const x = Math.min(...xs);
	const y = Math.min(...ys);
	return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

export function weatherScene(kind: WeatherKind, detail: ResolvedDetail): WeatherScene {
	const rain = rainOf(kind);
	const scale = CLOUD_SCALES[kind];
	const symbol = clouds[cloudKindOf(kind)];
	const all = groundsOf(kind).map((ground, index): WeatherCloud => {
		const width = symbol.width * scale;
		const height = symbol.height * scale;
		const cloud = {
			x: ground.x - width / 2,
			y: ground.y - CLOUD_ALTITUDE - height,
			width,
			height
		};
		const shadowWidth = cloudShadow.width * scale;
		const shadowHeight = cloudShadow.height * scale;
		return {
			key: `${kind}-${index}`,
			kind: cloudKindOf(kind),
			ground,
			cloud,
			shadow: {
				x: ground.x + CLOUD_SHADOW_OFFSET.x - shadowWidth / 2,
				y: ground.y + CLOUD_SHADOW_OFFSET.y - shadowHeight / 2,
				width: shadowWidth,
				height: shadowHeight
			},
			rain: rain === null ? null : rainColumn(ground, cloud, rain)
		};
	});
	const shown = detail === 'light' ? all.filter((_, index) => index % 2 === 0) : all;
	return {
		kind,
		rain,
		clouds: shown,
		rainBounds: boundsOf(shown.flatMap((item) => item.rain ?? [])),
		dim: WEATHER_DIM[kind],
		tint: kind === 'drought' ? DROUGHT_TINT : 0
	};
}

function riverYAt(layout: SegmentLayout, x: number): number {
	let best = layout.anchor;
	for (const point of slice(layout.start, layout.end)) {
		if (Math.abs(point.x - x) < Math.abs(best.x - x)) best = point;
	}
	return best.y;
}

export function runoffMarks(state: SimState): RunoffMark[] {
	return state.tiles.flatMap((tile) => {
		if (tile.landUse === 'forest') return [];
		const plot = plotById(tile.id);
		if (plot === null) return [];
		const layout = segmentLayout(plot.segment);
		const direction = plot.above ? 1 : -1;
		const width = runoffOf(tile, state.month, state.upkeepPaid) * RUNOFF_WIDTH_PER_C;
		return RUNOFF_STRANDS.map((offset, order) => {
			const x = plot.center.x + offset;
			const end = riverYAt(layout, x) - direction * (RIVER_WIDTH / 2 - RUNOFF_INTO_WATER);
			const start = end - direction * Math.min(RUNOFF_LENGTH, Math.abs(end - plot.center.y));
			const middle = (start + end) / 2;
			const bend = order % 2 === 0 ? 10 : -10;
			return {
				key: `${tile.id}-${order}`,
				d: `M${x} ${start} Q${x + bend} ${middle} ${x} ${end}`,
				width
			};
		});
	});
}

export function soakMarks(state: SimState): SoakMark[] {
	const forest = state.tiles.flatMap((tile) => {
		if (tile.landUse !== 'forest' || tile.forestMaturity < 1) return [];
		const plot = plotById(tile.id);
		if (plot === null) return [];
		return SOAK_OFFSETS.map((offset, order) => ({
			key: `${tile.id}-${order}`,
			x: plot.center.x + offset.x,
			y: plot.center.y + offset.y
		}));
	});
	const banks = state.segments.flatMap((segment) => {
		const active = segment.interventions.some(
			(item) => item.type === 'greenbelt' && item.activeFrom <= state.month
		);
		if (!active) return [];
		const layout = segmentLayout(segment.index);
		return SOAK_BANK_SHARES.flatMap((share, order) =>
			[-1, 1].map((side) => {
				const point = reachPoint(layout, share, side * BANK_LATERAL);
				return { key: `bank-${segment.index}-${order}-${side}`, x: point.x, y: point.y };
			})
		);
	});
	return [...forest, ...banks];
}

export function splashPoints(): SoakMark[] {
	return segments.flatMap((layout) =>
		SPLASH_SHARES.flatMap((share, order) =>
			SPLASH_LATERALS.map((lateral, side) => {
				const point = reachPoint(layout, share + side * 0.08, lateral);
				return { key: `${layout.index}-${order}-${side}`, x: point.x, y: point.y };
			})
		)
	);
}
