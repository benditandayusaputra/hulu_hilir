import {
	IPAL_COMMUNAL_DENSE_COST,
	RELOCATION_RESULT,
	actionSpecs,
	floodgateSegments
} from './constants';
import {
	actionTypes,
	landUses,
	riverInterventions,
	segmentIndices,
	segmentInterventions,
	tileInterventions,
	type Action,
	type ActionError,
	type ActionErrorCode,
	type Intervention,
	type InterventionType,
	type LandUse,
	type Result,
	type SegmentIndex,
	type SegmentState,
	type SimState,
	type TileId,
	type TileState
} from './types';

export type ActionResult = Result<SimState, ActionError>;

const tileIdPattern = /^S([1-6])-([LR])([12])$/;
const segmentPattern = /^S?([1-6])$/;
export const RIVER_TARGET = 'river';

function fail(action: Action, code: ActionErrorCode): ActionResult {
	return { ok: false, error: { code, action } };
}

export function parseSegmentIndex(target: string): SegmentIndex | null {
	const match = segmentPattern.exec(target);
	if (!match) return null;
	return segmentIndices.find((index) => String(index) === match[1]) ?? null;
}

export function isTileId(target: string): target is TileId {
	return tileIdPattern.test(target);
}

export function findTile(state: SimState, target: string): TileState | null {
	return state.tiles.find((tile) => tile.id === target) ?? null;
}

export function isActionType(value: string): value is Action['type'] {
	return actionTypes.some((type) => type === value);
}

function isLandUse(value: string | undefined): value is LandUse {
	return landUses.some((use) => use === value);
}

function isIntervention(value: string | undefined): value is InterventionType {
	return (
		tileInterventions.some((type) => type === value) ||
		segmentInterventions.some((type) => type === value) ||
		riverInterventions.some((type) => type === value)
	);
}

export function buildCostOf(type: Action['type'], landUse: LandUse | null): number {
	if (type === 'ipal_communal' && landUse === 'dense_settlement') return IPAL_COMMUNAL_DENSE_COST;
	return actionSpecs[type].buildCost;
}

function charge(state: SimState, action: Action, cost: number): ActionResult {
	if (state.cash === null || cost === 0) return { ok: true, value: state };
	if (state.cash < cost) return fail(action, 'insufficient_cash');
	return { ok: true, value: { ...state, cash: state.cash - cost } };
}

function replaceTile(state: SimState, tile: TileState): SimState {
	return { ...state, tiles: state.tiles.map((item) => (item.id === tile.id ? tile : item)) };
}

function replaceSegment(state: SimState, segment: SegmentState): SimState {
	return {
		...state,
		segments: state.segments.map((item) => (item.index === segment.index ? segment : item))
	};
}

function tileChange(tile: TileState, action: Action): TileState | null {
	if (action.type === 'plant_forest') return { ...tile, landUse: 'forest', forestMaturity: 0 };
	if (action.type === 'change_land_use') {
		if (!isLandUse(action.choice)) return null;
		return { ...tile, landUse: action.choice, forestMaturity: 1, interventions: [] };
	}
	if (!isIntervention(action.type)) return tile;
	const intervention: Intervention = {
		type: action.type,
		activeFrom: action.month + actionSpecs[action.type].leadMonths
	};
	return { ...tile, interventions: [...tile.interventions, intervention] };
}

function applyTileAction(state: SimState, action: Action): ActionResult {
	const tile = findTile(state, action.target);
	if (!tile) return fail(action, 'invalid_target');
	const spec = actionSpecs[action.type];
	if (spec.landUses && !spec.landUses.includes(tile.landUse)) {
		return fail(action, 'incompatible_land_use');
	}
	if (tile.interventions.some((item) => item.type === action.type)) {
		return fail(action, 'already_installed');
	}
	const changed = tileChange(tile, action);
	if (!changed) return fail(action, 'invalid_target');
	const charged = charge(state, action, buildCostOf(action.type, tile.landUse));
	if (!charged.ok) return charged;
	return { ok: true, value: replaceTile(charged.value, changed) };
}

function applySegmentAction(state: SimState, action: Action): ActionResult {
	const index = parseSegmentIndex(action.target);
	const segment = index === null ? null : state.segments[index - 1];
	if (index === null || !segment) return fail(action, 'invalid_target');
	if (action.type === 'floodgate' && !floodgateSegments.includes(index)) {
		return fail(action, 'invalid_target');
	}
	if (segment.interventions.some((item) => item.type === action.type)) {
		return fail(action, 'already_installed');
	}
	const charged = charge(state, action, buildCostOf(action.type, null));
	if (!charged.ok) return charged;
	if (!isIntervention(action.type)) return charged;
	const intervention: Intervention = {
		type: action.type,
		activeFrom: action.month + actionSpecs[action.type].leadMonths
	};
	return {
		ok: true,
		value: replaceSegment(charged.value, {
			...segment,
			interventions: [...segment.interventions, intervention]
		})
	};
}

function applyRiverAction(state: SimState, action: Action): ActionResult {
	if (action.target !== RIVER_TARGET) return fail(action, 'invalid_target');
	if (state.riverInterventions.some((item) => item.type === action.type)) {
		return fail(action, 'already_installed');
	}
	const charged = charge(state, action, buildCostOf(action.type, null));
	if (!charged.ok || !isIntervention(action.type)) return charged;
	const intervention: Intervention = { type: action.type, activeFrom: action.month };
	return {
		ok: true,
		value: { ...charged.value, riverInterventions: [...state.riverInterventions, intervention] }
	};
}

function without(list: readonly Intervention[], type: string): Intervention[] {
	return list.filter((item) => item.type !== type);
}

function applyDismantle(state: SimState, action: Action): ActionResult {
	const type = action.choice;
	if (!isIntervention(type)) return fail(action, 'invalid_target');
	if (action.target === RIVER_TARGET) {
		if (!state.riverInterventions.some((item) => item.type === type)) {
			return fail(action, 'nothing_to_dismantle');
		}
		return {
			ok: true,
			value: { ...state, riverInterventions: without(state.riverInterventions, type) }
		};
	}
	const tile = findTile(state, action.target);
	if (tile) {
		if (!tile.interventions.some((item) => item.type === type))
			return fail(action, 'nothing_to_dismantle');
		return {
			ok: true,
			value: replaceTile(state, { ...tile, interventions: without(tile.interventions, type) })
		};
	}
	const index = parseSegmentIndex(action.target);
	const segment = index === null ? null : state.segments[index - 1];
	if (!segment) return fail(action, 'invalid_target');
	if (!segment.interventions.some((item) => item.type === type))
		return fail(action, 'nothing_to_dismantle');
	const greenbeltMaturity = type === 'greenbelt' ? 0 : segment.greenbeltMaturity;
	return {
		ok: true,
		value: replaceSegment(state, {
			...segment,
			interventions: without(segment.interventions, type),
			greenbeltMaturity
		})
	};
}

export function applyAction(state: SimState, action: Action): ActionResult {
	if (!isActionType(action.type)) return fail(action, 'unknown_action');
	const spec = actionSpecs[action.type];
	if (spec.labOnly && state.scenario.mission) return fail(action, 'lab_only');
	if (action.type === 'dismantle') return applyDismantle(state, action);
	if (spec.scope === 'tile') return applyTileAction(state, action);
	if (spec.scope === 'segment') return applySegmentAction(state, action);
	return applyRiverAction(state, action);
}

export function settleRelocations(tiles: readonly TileState[], month: number): TileState[] {
	return tiles.map((tile) => {
		const due = tile.interventions.some(
			(item) => item.type === 'relocation' && item.activeFrom <= month
		);
		if (!due) return tile;
		return { ...tile, landUse: RELOCATION_RESULT, forestMaturity: 0, interventions: [] };
	});
}

export function segmentsTargetedBy(
	actions: readonly Action[],
	type: Action['type']
): Set<SegmentIndex> {
	const result = new Set<SegmentIndex>();
	for (const action of actions) {
		if (action.type !== type) continue;
		const index = parseSegmentIndex(action.target);
		if (index !== null) result.add(index);
	}
	return result;
}
