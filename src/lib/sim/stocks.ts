import {
	FLOOD_LITTER_TRANSFER,
	FLOOD_SEDIMENT_GAIN,
	FOREST_MATURITY_MONTHS,
	GREENBELT_MATURITY_MONTHS,
	HIGH_FLOW_FACTOR_THRESHOLD,
	HYACINTH_CLEARING,
	HYACINTH_DECLINE,
	HYACINTH_GROWTH,
	HYACINTH_PHOSPHATE_THRESHOLD,
	HYACINTH_VELOCITY_THRESHOLD,
	LITTER_CLEANUP,
	LITTER_COMMUNITY_CLEANUP,
	LITTER_DOWNSTREAM_SHARE,
	LITTER_MAX,
	LITTER_WASTE_BANK_FACTOR,
	SEDIMENT_DREDGING_LOSS,
	SEDIMENT_GAIN_PER_SETTLED_TSS,
	SEDIMENT_HIGH_FLOW_LOSS,
	SEDIMENT_LANDSLIDE_GAIN,
	SEDIMENT_SETTLED_TSS_UNIT,
	landUseSpecs,
	segmentSpecs
} from './constants';
import { hasActive } from './loads';
import { segmentIndices, type SegmentIndex, type TileState } from './types';

export interface SedimentChange {
	settledTss: number;
	flowFactor: number;
	flooded: boolean;
	landslide: boolean;
	dredged: boolean;
}

export interface LitterChange {
	month: number;
	upkeepPaid: boolean;
	flooded: ReadonlySet<SegmentIndex>;
	cleaned: ReadonlySet<SegmentIndex>;
	community: ReadonlySet<SegmentIndex>;
}

export interface LitterUpdate {
	litter: number[];
	toSea: number;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function updateSediment(current: number, change: SedimentChange): number {
	let next = current;
	next += SEDIMENT_GAIN_PER_SETTLED_TSS * (change.settledTss / SEDIMENT_SETTLED_TSS_UNIT);
	if (change.flooded) next += FLOOD_SEDIMENT_GAIN;
	if (change.landslide) next += SEDIMENT_LANDSLIDE_GAIN;
	if (change.flowFactor >= HIGH_FLOW_FACTOR_THRESHOLD) next -= SEDIMENT_HIGH_FLOW_LOSS;
	if (change.dredged) next -= SEDIMENT_DREDGING_LOSS;
	return clamp(next, 0, 1);
}

export function litterInputOf(tile: TileState, month: number, upkeepPaid: boolean): number {
	const base = landUseSpecs[tile.landUse].litter;
	const bank = hasActive(tile.interventions, 'waste_bank', month, upkeepPaid);
	return base * (bank ? LITTER_WASTE_BANK_FACTOR : 1);
}

export function updateLitter(
	current: readonly number[],
	tiles: readonly TileState[],
	change: LitterChange
): LitterUpdate {
	const litter = segmentIndices.map((index, i) => {
		let value = current[i] ?? 0;
		for (const tile of tiles) {
			if (tile.segment === index) value += litterInputOf(tile, change.month, change.upkeepPaid);
		}
		if (change.cleaned.has(index)) value -= LITTER_CLEANUP;
		if (change.community.has(index)) value -= LITTER_COMMUNITY_CLEANUP;
		return clamp(value, 0, LITTER_MAX);
	});
	let toSea = 0;
	for (let i = litter.length - 1; i >= 0; i -= 1) {
		const index = segmentIndices[i];
		const value = litter[i] ?? 0;
		const share =
			LITTER_DOWNSTREAM_SHARE +
			(index !== undefined && change.flooded.has(index) ? FLOOD_LITTER_TRANSFER : 0);
		const moved = value * Math.min(1, share);
		litter[i] = value - moved;
		if (i === litter.length - 1) toSea = moved;
		else litter[i + 1] = clamp((litter[i + 1] ?? 0) + moved, 0, LITTER_MAX);
	}
	return { litter, toSea };
}

export function updateHyacinth(
	current: number,
	index: SegmentIndex,
	phosphate: number,
	cleared: boolean
): number {
	const grows =
		phosphate > HYACINTH_PHOSPHATE_THRESHOLD &&
		segmentSpecs[index].velocity < HYACINTH_VELOCITY_THRESHOLD;
	let next = current + (grows ? HYACINTH_GROWTH : -HYACINTH_DECLINE);
	if (cleared) next -= HYACINTH_CLEARING;
	return clamp(next, 0, 1);
}

export function matureForest(tile: TileState): TileState {
	if (tile.landUse !== 'forest' || tile.forestMaturity >= 1) return tile;
	return { ...tile, forestMaturity: Math.min(1, tile.forestMaturity + 1 / FOREST_MATURITY_MONTHS) };
}

export function matureGreenbelt(current: number, installed: boolean): number {
	if (!installed) return 0;
	return Math.min(1, current + 1 / GREENBELT_MATURITY_MONTHS);
}
