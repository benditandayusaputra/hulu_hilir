import {
	ECONOMY_JOBS_WEIGHT,
	ECONOMY_REVENUE_WEIGHT,
	ECOTOURISM_JOBS_BONUS,
	ECOTOURISM_REVENUE_BONUS,
	ECO_FARMING_REVENUE_FACTOR,
	ENFORCEMENT_ECONOMY_PENALTY_PER_FACTORY,
	ENFORCEMENT_FINE_PER_FACTORY,
	INDICATOR_MAX,
	IPAL_COMMUNAL_DENSE_UPKEEP,
	actionSpecs,
	landUseSpecs
} from './constants';
import { hasActive, isActive } from './loads';
import type { EconomyState, Intervention, SegmentIndex, TileState } from './types';

export interface EconomyInput {
	tiles: readonly TileState[];
	month: number;
	upkeepPaid: boolean;
	ecotourism: ReadonlySet<SegmentIndex>;
	failedPaddies: ReadonlySet<SegmentIndex>;
}

export interface CashSettlement {
	cash: number | null;
	received: number;
	upkeepPaid: boolean;
}

export function tileEconomy(tile: TileState, input: EconomyInput): EconomyState {
	const spec = landUseSpecs[tile.landUse];
	let revenue = spec.revenue;
	let jobs = spec.jobs;
	if (tile.landUse === 'forest' && input.ecotourism.has(tile.segment)) {
		revenue += ECOTOURISM_REVENUE_BONUS;
		jobs += ECOTOURISM_JOBS_BONUS;
	}
	if (tile.landUse === 'paddy') {
		if (input.failedPaddies.has(tile.segment)) revenue = 0;
		if (hasActive(tile.interventions, 'eco_farming', input.month, input.upkeepPaid)) {
			revenue *= ECO_FARMING_REVENUE_FACTOR;
		}
	}
	return { revenue, jobs };
}

export function economyOf(input: EconomyInput): EconomyState {
	let revenue = 0;
	let jobs = 0;
	for (const tile of input.tiles) {
		const part = tileEconomy(tile, input);
		revenue += part.revenue;
		jobs += part.jobs;
	}
	return { revenue, jobs };
}

function ratio(value: number, base: number): number {
	return base <= 0 ? 1 : value / base;
}

export function untreatedFactories(
	tiles: readonly TileState[],
	month: number,
	upkeepPaid: boolean
): number {
	return tiles.filter(
		(tile) =>
			tile.landUse === 'factory' &&
			!hasActive(tile.interventions, 'ipal_industrial', month, upkeepPaid)
	).length;
}

export function economyScore(
	economy: EconomyState,
	baseline: EconomyState,
	untreated: number,
	enforcement: boolean
): number {
	const base =
		ECONOMY_REVENUE_WEIGHT * ratio(economy.revenue, baseline.revenue) +
		ECONOMY_JOBS_WEIGHT * ratio(economy.jobs, baseline.jobs);
	const penalty = enforcement ? ENFORCEMENT_ECONOMY_PENALTY_PER_FACTORY * untreated : 0;
	return Math.min(INDICATOR_MAX, Math.max(0, INDICATOR_MAX * base * (1 - penalty)));
}

export function upkeepOf(intervention: Intervention, tile: TileState | null): number {
	if (intervention.type === 'ipal_communal' && tile?.landUse === 'dense_settlement') {
		return IPAL_COMMUNAL_DENSE_UPKEEP;
	}
	return actionSpecs[intervention.type].upkeep;
}

export function monthlyUpkeep(
	tiles: readonly TileState[],
	segmentInterventions: readonly (readonly Intervention[])[],
	riverInterventions: readonly Intervention[],
	month: number
): number {
	let total = 0;
	for (const tile of tiles) {
		for (const item of tile.interventions) {
			if (isActive(item, month, true)) total += upkeepOf(item, tile);
		}
	}
	for (const list of segmentInterventions) {
		for (const item of list) if (isActive(item, month, true)) total += upkeepOf(item, null);
	}
	for (const item of riverInterventions) {
		if (isActive(item, month, true)) total += upkeepOf(item, null);
	}
	return total;
}

export function finesOf(untreated: number, enforcement: boolean): number {
	return enforcement ? ENFORCEMENT_FINE_PER_FACTORY * untreated : 0;
}

export function settleCash(
	cash: number | null,
	allocation: number,
	fines: number,
	upkeep: number
): CashSettlement {
	if (cash === null) return { cash: null, received: 0, upkeepPaid: true };
	const received = allocation + fines;
	const available = cash + received;
	if (available >= upkeep) return { cash: available - upkeep, received, upkeepPaid: true };
	return { cash: available, received, upkeepPaid: false };
}
