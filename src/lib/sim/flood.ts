import {
	CAPACITY_HYACINTH_LOSS,
	CAPACITY_LITTER_LOSS,
	CAPACITY_SEDIMENT_LOSS,
	FLOOD_ATTENUATION,
	FLOOD_LOSS_PER_TILE,
	FLOOD_RESIDENT_FACTOR,
	FLOOD_RISK_OFFSET,
	FLOOD_RISK_SCALE,
	INDICATOR_MAX,
	LITTER_MAX,
	RATIONAL_METHOD_COEFFICIENT,
	RETENTION_POND_REDUCTION,
	TILE_CATCHMENT_KM2,
	floodRatioThresholds,
	landUseSpecs,
	segmentSpecs
} from './constants';
import {
	floodStatuses,
	segmentIndices,
	type FloodStatus,
	type SegmentIndex,
	type TileState
} from './types';

export interface TileRunoff {
	segment: SegmentIndex;
	runoff: number;
}

export interface FloodImpact {
	affectedResidents: number;
	losses: number;
	failedPaddies: number;
}

export function localRunoffPeaks(tiles: readonly TileRunoff[], intensity: number): number[] {
	const peaks = segmentIndices.map(() => 0);
	for (const tile of tiles) {
		peaks[tile.segment - 1] =
			(peaks[tile.segment - 1] ?? 0) +
			RATIONAL_METHOD_COEFFICIENT * tile.runoff * intensity * TILE_CATCHMENT_KM2;
	}
	return peaks;
}

export function peakFlows(
	flows: readonly number[],
	tiles: readonly TileRunoff[],
	intensity: number,
	retention: ReadonlySet<SegmentIndex>
): number[] {
	const local = localRunoffPeaks(tiles, intensity);
	return segmentIndices.map((index, k) => {
		let runoff = 0;
		for (let j = 0; j <= k; j += 1) {
			runoff += FLOOD_ATTENUATION ** (k - j) * (local[j] ?? 0);
		}
		const reduction = retention.has(index) ? RETENTION_POND_REDUCTION : 0;
		return Math.max(0, (flows[k] ?? 0) + runoff - reduction);
	});
}

export function effectiveCapacity(
	index: SegmentIndex,
	sediment: number,
	litter: number,
	hyacinth: number,
	tideFactor: number
): number {
	return (
		segmentSpecs[index].channelCapacity *
		(1 - CAPACITY_SEDIMENT_LOSS * sediment) *
		(1 - CAPACITY_LITTER_LOSS * (litter / LITTER_MAX)) *
		(1 - CAPACITY_HYACINTH_LOSS * hyacinth) *
		tideFactor
	);
}

export function floodStatusOf(ratio: number): FloodStatus {
	for (const status of floodStatuses) {
		if (
			status === 'safe' ? ratio < floodRatioThresholds.safe : ratio <= floodRatioThresholds[status]
		) {
			return status;
		}
	}
	return 'major';
}

export function floodRiskScore(ratios: readonly number[]): number {
	const worst = Math.max(...ratios);
	const scaled = (worst - FLOOD_RISK_OFFSET) / FLOOD_RISK_SCALE;
	return INDICATOR_MAX * Math.min(1, Math.max(0, scaled));
}

export function floodImpact(tiles: readonly TileState[], ratio: number): FloodImpact {
	const share = Math.min(1, (ratio - 1) * FLOOD_RESIDENT_FACTOR);
	let population = 0;
	let builtTiles = 0;
	let failedPaddies = 0;
	for (const tile of tiles) {
		population += landUseSpecs[tile.landUse].population;
		if (tile.landUse === 'paddy') failedPaddies += 1;
		if (tile.landUse === 'factory' || landUseSpecs[tile.landUse].population > 0) builtTiles += 1;
	}
	return {
		affectedResidents: Math.round(population * Math.max(0, share)),
		losses: FLOOD_LOSS_PER_TILE * ratio * builtTiles,
		failedPaddies
	};
}
