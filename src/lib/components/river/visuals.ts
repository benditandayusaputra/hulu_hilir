import {
	actionNames,
	factoryUntreatedName,
	forestStageNames,
	landUseNames,
	tileName,
	type TileSideKey
} from '$lib/content/lab';
import {
	fishScore,
	FLOOD_RISK_OFFSET,
	FLOOD_RISK_SCALE,
	type FishPopulation,
	type InterventionType,
	type TileState,
	type WaterStatus
} from '$lib/sim';

export const FOREST_STAGE_YOUNG = 0.25;
export const FOREST_STAGE_TEEN = 0.5;
export const MAX_FISH_ICONS = 5;
export const FLOW_DURATION_SLOW_S = 6;
export const FLOW_DURATION_FAST_S = 1.2;
export const FLOW_REFERENCE_M3S = 12;
export const LITTER_PER_ICON = 25;
export const MAX_LITTER_ICONS = 4;
export const HYACINTH_VISIBLE_COVER = 0.15;

export function forestStageOf(maturity: number): number {
	if (maturity >= 1) return 3;
	if (maturity >= FOREST_STAGE_TEEN) return 2;
	if (maturity >= FOREST_STAGE_YOUNG) return 1;
	return 0;
}

export function tileArtId(tile: TileState): string {
	if (tile.landUse === 'forest') return `art-forest-${forestStageOf(tile.forestMaturity)}`;
	return `art-${tile.landUse}`;
}

export function badgeId(type: InterventionType): string {
	return `badge-${type}`;
}

export function waterPatternId(status: WaterStatus): string {
	return `water-pattern-${status}`;
}

export function fishIconCount(fish: FishPopulation): number {
	return Math.round((fishScore(fish) / 100) * MAX_FISH_ICONS);
}

export function flowDurationSeconds(flow: number): number {
	const share = Math.max(0, Math.min(1, flow / FLOW_REFERENCE_M3S));
	return FLOW_DURATION_SLOW_S - (FLOW_DURATION_SLOW_S - FLOW_DURATION_FAST_S) * share;
}

export function litterIconCount(litter: number): number {
	return Math.min(MAX_LITTER_ICONS, Math.round(litter / LITTER_PER_ICON));
}

export function floodLevelOf(ratio: number): number {
	return Math.max(0, Math.min(1, (ratio - FLOOD_RISK_OFFSET) / FLOOD_RISK_SCALE));
}

export function tileSideKeyOf(tile: TileState): TileSideKey {
	return `${tile.side}${tile.position}`;
}

export function hasIntervention(tile: TileState, type: InterventionType): boolean {
	return tile.interventions.some((item) => item.type === type);
}

export function tileLabelOf(tile: TileState): string {
	if (tile.landUse === 'factory' && !hasIntervention(tile, 'ipal_industrial')) {
		return factoryUntreatedName;
	}
	return landUseNames[tile.landUse];
}

export function tileStageOf(tile: TileState): string | null {
	if (tile.landUse !== 'forest' || tile.forestMaturity >= 1) return null;
	return forestStageNames[forestStageOf(tile.forestMaturity)] ?? null;
}

export function tileNameOf(tile: TileState, status: WaterStatus): string {
	return tileName(
		tile.segment,
		tileSideKeyOf(tile),
		tileLabelOf(tile),
		tileStageOf(tile),
		tile.interventions.map((item) => actionNames[item.type]),
		status
	);
}
