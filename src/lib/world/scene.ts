import {
	boat,
	birdEgret,
	denseSettlement,
	factory,
	floodgate,
	forestStages,
	hyacinth,
	openLand,
	paddyStages,
	props,
	retentionPond,
	settlement,
	waterItems,
	type WorldSymbol
} from '$lib/components/world/art/symbols';
import {
	fishIconCount,
	forestStageOf,
	HYACINTH_VISIBLE_COVER,
	litterIconCount
} from '$lib/components/river/visuals';
import {
	actionSpecs,
	type Intervention,
	type SegmentState,
	type SimState,
	type TileState,
	type TileId,
	type WaterStatus
} from '$lib/sim';
import { ASSET_GROUND_OFFSET, RIVER_WIDTH } from './constants';
import type { ResolvedDetail } from './detail';
import { plotById, reachPoint, segmentLayout, type Point, type SegmentLayout } from './layout';

export const HARVEST_MONTHS: readonly number[] = [3, 4, 8, 9];
export const PROP_OFFSET = { x: 72, y: 50, step: 62 } as const;
export const SEGMENT_SLOT = { along: 400, pond: 330, gate: 300 } as const;
export const BANK_LATERAL = RIVER_WIDTH / 2 + 24;
export const BANK_SPACING = 95;
export const HYACINTH_CLUSTERS = 6;
export const DOWNSTREAM_BOAT_FROM = 4;

export interface Placed {
	key: string;
	href: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface BuildRing {
	key: string;
	x: number;
	y: number;
	progress: number;
}

export interface PlotView {
	id: TileId;
	center: Point;
	asset: Placed;
	props: Placed[];
	rings: BuildRing[];
	chimney: Point | null;
}

export type ItemMotion = 'drift' | 'swim' | null;

export interface WaterItem {
	key: string;
	href: string;
	x: number;
	y: number;
	turn: number;
	scale: number;
	size: { width: number; height: number } | null;
	motion: ItemMotion;
	marker: boolean;
}

const tileProps: Partial<Record<Intervention['type'], WorldSymbol>> = {
	ipal_industrial: props.ipal,
	ipal_communal: props.ipal,
	waste_bank: props.bins,
	biopori: props.biopori,
	eco_farming: props.eco,
	relocation: props.relocation
};

const FACTORY_CHIMNEY = { x: 46, y: 40 } as const;

function placed(key: string, symbol: WorldSymbol, bottom: Point): Placed {
	return {
		key,
		href: symbol.id,
		x: bottom.x - symbol.width / 2,
		y: bottom.y - symbol.height,
		width: symbol.width,
		height: symbol.height
	};
}

export function assetOf(tile: TileState, calendarMonth: number): WorldSymbol {
	switch (tile.landUse) {
		case 'forest':
			return forestStages[forestStageOf(tile.forestMaturity)] ?? forestStages[3];
		case 'paddy':
			return HARVEST_MONTHS.includes(calendarMonth) ? paddyStages.harvest : paddyStages.planted;
		case 'settlement':
			return settlement;
		case 'dense_settlement':
			return denseSettlement;
		case 'factory':
			return factory;
		case 'open_land':
			return openLand;
	}
}

export function buildProgress(item: Intervention, month: number): number | null {
	if (item.activeFrom <= month) return null;
	const lead = actionSpecs[item.type].leadMonths;
	if (lead <= 0) return null;
	const started = item.activeFrom - lead;
	return Math.max(0, Math.min(1, (month - started) / lead));
}

export function plotView(tile: TileState, month: number, calendarMonth: number): PlotView | null {
	const layout = plotById(tile.id);
	if (layout === null) return null;
	const ground = { x: layout.center.x, y: layout.center.y + ASSET_GROUND_OFFSET };
	const symbol = assetOf(tile, calendarMonth);
	const asset = placed(`${tile.id}-asset`, symbol, ground);
	const placedProps: Placed[] = [];
	const rings: BuildRing[] = [];
	tile.interventions.forEach((item, order) => {
		const prop = tileProps[item.type];
		if (prop === undefined) return;
		const bottom = {
			x: layout.center.x + PROP_OFFSET.x - order * PROP_OFFSET.step,
			y: layout.center.y + PROP_OFFSET.y
		};
		placedProps.push(placed(`${tile.id}-${item.type}`, prop, bottom));
		const progress = buildProgress(item, month);
		if (progress !== null) {
			rings.push({
				key: `${tile.id}-${item.type}-ring`,
				x: bottom.x,
				y: bottom.y - prop.height / 2,
				progress
			});
		}
	});
	const chimney =
		tile.landUse === 'factory'
			? { x: asset.x + FACTORY_CHIMNEY.x, y: asset.y + FACTORY_CHIMNEY.y }
			: null;
	return { id: tile.id, center: layout.center, asset, props: placedProps, rings, chimney };
}

export function plotViews(state: SimState, calendarMonth: number): PlotView[] {
	return state.tiles
		.map((tile) => plotView(tile, state.month, calendarMonth))
		.filter((view): view is PlotView => view !== null)
		.sort((a, b) => a.center.y - b.center.y);
}

export interface SegmentObjects {
	structures: Placed[];
	rings: BuildRing[];
	bank: Placed[];
}

function bankPlants(layout: SegmentLayout, mature: boolean, index: number): Placed[] {
	const length = layout.end - layout.start;
	const count = Math.max(2, Math.floor(length / BANK_SPACING));
	const plants: Placed[] = [];
	for (let i = 0; i < count; i += 1) {
		const share = (i + 0.5) / count;
		for (const side of [-1, 1] as const) {
			const point = reachPoint(layout, share, side * BANK_LATERAL);
			const symbol = mature && (i + (side === 1 ? 1 : 0)) % 2 === 0 ? props.sapling : props.shrub;
			plants.push(placed(`bank-${index}-${i}-${side}`, symbol, point));
		}
	}
	return plants;
}

export function segmentObjects(state: SimState): SegmentObjects {
	const structures: Placed[] = [];
	const rings: BuildRing[] = [];
	const bank: Placed[] = [];
	for (const segment of state.segments) {
		const layout = segmentLayout(segment.index);
		for (const item of segment.interventions) {
			const progress = buildProgress(item, state.month);
			let spot: Point | null = null;
			if (item.type === 'retention_pond') {
				spot = {
					x: layout.anchor.x - layout.flow * SEGMENT_SLOT.along,
					y: layout.anchor.y + SEGMENT_SLOT.pond
				};
				structures.push(placed(`pond-${segment.index}`, retentionPond, spot));
			} else if (item.type === 'floodgate') {
				spot = {
					x: layout.anchor.x + layout.flow * SEGMENT_SLOT.along,
					y: layout.anchor.y + SEGMENT_SLOT.gate
				};
				structures.push(placed(`gate-${segment.index}`, floodgate, spot));
			} else if (item.type === 'greenbelt') {
				bank.push(...bankPlants(layout, progress === null, segment.index));
				spot = { x: layout.anchor.x, y: layout.anchor.y - BANK_LATERAL };
			}
			if (spot !== null && progress !== null) {
				rings.push({
					key: `${item.type}-${segment.index}-ring`,
					x: spot.x,
					y: spot.y - 60,
					progress
				});
			}
		}
	}
	structures.sort((a, b) => a.y + a.height - (b.y + b.height));
	return { structures, rings, bank };
}

const lateralPattern: readonly number[] = [-32, 18, -8, 36, -22, 8, 28, -38];

function lateralAt(order: number): number {
	return lateralPattern[order % lateralPattern.length] ?? 0;
}

function spread(count: number, offset: number): number[] {
	return Array.from({ length: count }, (_, i) => (i + 0.5 + offset) / (count + offset * 2));
}

interface ItemSpec {
	href: string;
	motion: ItemMotion;
	marker: boolean;
	size?: WorldSymbol;
	lateral?: number;
	turn?: number;
	scale?: number;
}

function floatingMarkers(status: WaterStatus): ItemSpec[] {
	const trash: ItemSpec[] = [
		{ href: waterItems.bottle, motion: 'drift', marker: true, turn: -15 },
		{ href: waterItems.bag, motion: 'drift', marker: true, turn: 8 },
		{ href: waterItems.can, motion: 'drift', marker: true, turn: 25 }
	];
	switch (status) {
		case 'good':
			return [];
		case 'light':
			return [];
		case 'moderate':
			return trash;
		case 'heavy':
			return [
				{ href: waterItems.sludge, motion: null, marker: true, scale: 1.4 },
				...trash,
				{ href: waterItems.deadFish, motion: 'drift', marker: true, turn: -8 },
				{ href: waterItems.sludge, motion: null, marker: true, scale: 1.2 },
				{ href: waterItems.bottle, motion: 'drift', marker: true, turn: 30 },
				{ href: waterItems.deadFish, motion: 'drift', marker: true, turn: 170 },
				{ href: waterItems.sludge, motion: null, marker: true }
			];
	}
}

function edgeMarker(status: WaterStatus): string | null {
	if (status === 'light') return waterItems.foam;
	if (status === 'heavy') return waterItems.scum;
	return null;
}

export function waterItemsOf(segment: SegmentState, detail: ResolvedDetail): WaterItem[] {
	const layout = segmentLayout(segment.index);
	const light = detail === 'light';
	const items: WaterItem[] = [];
	const push = (spec: ItemSpec, share: number, order: number, lateral = lateralAt(order)) => {
		const point = reachPoint(layout, share, spec.lateral ?? lateral);
		items.push({
			key: `${segment.index}-${spec.href}-${order}-${share.toFixed(3)}`,
			href: spec.href,
			x: point.x,
			y: point.y,
			turn: spec.turn ?? 0,
			scale: spec.scale ?? 1,
			size: spec.size ? { width: spec.size.width, height: spec.size.height } : null,
			motion: spec.motion,
			marker: spec.marker
		});
	};

	const markers = floatingMarkers(segment.status);
	spread(markers.length, 0.3).forEach((share, order) => {
		const spec = markers[order];
		if (spec) push(spec, share, order);
	});

	const edge = edgeMarker(segment.status);
	if (edge !== null) {
		const count = Math.max(3, Math.round((layout.end - layout.start) / 240));
		spread(count, 0).forEach((share, order) => {
			const side = order % 2 === 0 ? -1 : 1;
			push(
				{ href: edge, motion: null, marker: true, lateral: side * (RIVER_WIDTH / 2 - 12) },
				share,
				order + 100
			);
		});
	}

	const litter = Math.ceil(litterIconCount(segment.litter) / (light ? 2 : 1));
	const litterItems = [waterItems.bottle, waterItems.bag, waterItems.can];
	spread(litter, 1).forEach((share, order) => {
		push(
			{
				href: litterItems[order % litterItems.length] ?? waterItems.bottle,
				motion: 'drift',
				marker: false,
				turn: order * 37
			},
			share,
			order + 200
		);
	});

	const fish = Math.ceil(fishIconCount(segment.fish) / (light ? 2 : 1));
	spread(fish, 0.5).forEach((share, order) => {
		push(
			{
				href: waterItems.fishShadow,
				motion: 'swim',
				marker: false,
				scale: layout.flow === 1 ? -1 : 1
			},
			share,
			order + 300
		);
	});

	if (segment.hyacinth >= HYACINTH_VISIBLE_COVER) {
		const clusters = Math.max(1, Math.ceil(segment.hyacinth * HYACINTH_CLUSTERS));
		spread(clusters, 0.2).forEach((share, order) => {
			push(
				{
					href: hyacinth.id,
					motion: null,
					marker: false,
					size: hyacinth,
					lateral: (order % 2 === 0 ? -1 : 1) * (RIVER_WIDTH / 2 - 26)
				},
				share,
				order + 400
			);
		});
	}

	if (segment.status !== 'heavy' && segment.index >= DOWNSTREAM_BOAT_FROM) {
		push({ href: boat.id, motion: null, marker: false, size: boat, lateral: 0 }, 0.72, 500);
	}

	if (segment.status === 'good') {
		push(
			{
				href: birdEgret.id,
				motion: null,
				marker: false,
				size: birdEgret,
				lateral: RIVER_WIDTH / 2 + 4
			},
			0.18,
			600
		);
	}

	return items;
}

export function tileSignature(tile: TileState): string {
	return `${tile.landUse}|${tile.interventions.map((item) => item.type).join(',')}`;
}

export type WorldEffect =
	| { id: number; kind: 'dust'; x: number; y: number }
	| { id: number; kind: 'cash'; x: number; y: number; text: string }
	| { id: number; kind: 'jump'; x: number; y: number; flow: 1 | -1 };

export const EFFECT_MS = { dust: 900, cash: 1600, jump: 1200, bounce: 600 } as const;
export const FLOOD_SPREAD = 360;
