import {
	actionNames,
	causeSourceNames,
	eventNames,
	fishGroupNames,
	monthNames,
	seasonNames,
	segmentNames,
	waterStatusNames
} from '$lib/content/lab';
import {
	fishGroups,
	fishScore,
	flowFactorOf,
	type ActionType,
	type CauseReport,
	type Season,
	type SegmentIndex,
	type SegmentState,
	type SimState,
	type TileState
} from '$lib/sim';
import { isEventType } from './events';
import type { Audience, CausePayload, NarrationPayload, SegmentPayload } from './schemas';
import { INTERVENTION_EFFECT_DELAY_MONTHS, worstSegmentOf, type DetectedTrigger } from './triggers';

export interface PayloadInput {
	trigger: DetectedTrigger;
	current: SimState;
	baseline: SimState;
	audience: Audience;
	calendarMonth: number;
	season: Season;
	causes: (segment: SegmentIndex) => CauseReport;
}

const MAX_LOAD_CAUSES = 2;
const MIN_SHARE = 0.05;
const MAX_ACTIONS = 6;
const HIGH_LITTER = 30;
const HIGH_HYACINTH = 0.3;
const HIGH_FLOOD_RATIO = 0.8;

function roundTo(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function segmentAt(state: SimState, index: SegmentIndex): SegmentState {
	const segment = state.segments[index - 1];
	if (segment === undefined) throw new Error('segment index out of range');
	return segment;
}

function segmentPayload(
	current: SimState,
	baseline: SimState,
	index: SegmentIndex
): SegmentPayload {
	const now = segmentAt(current, index);
	const before = segmentAt(baseline, index);
	return {
		id: index,
		name: segmentNames[index],
		statusBefore: waterStatusNames[before.status],
		statusAfter: waterStatusNames[now.status],
		ip: roundTo(now.pollutionIndex, 1),
		ipBefore: roundTo(before.pollutionIndex, 1),
		do: roundTo(now.concentrations.do, 1),
		bod: roundTo(now.concentrations.bod, 1),
		fecalColiform: Math.round(now.concentrations.fecalColiform),
		fish: Math.round(fishScore(now.fish))
	};
}

function loadCauses(report: CauseReport, segment: SegmentIndex): CausePayload[] {
	return report.bod
		.filter((share) => share.share >= MIN_SHARE && share.source !== 'background')
		.slice(0, MAX_LOAD_CAUSES)
		.map((share) => ({
			type: 'load',
			source: causeSourceNames[share.source],
			segment: share.segment ?? segment,
			shareOfBod: roundTo(share.share, 2)
		}));
}

function has(tile: TileState, type: string): boolean {
	return tile.interventions.some((item) => item.type === type);
}

export function availableActionsFor(state: SimState, index: SegmentIndex): ActionType[] {
	const actions: ActionType[] = [];
	const add = (type: ActionType) => {
		if (!actions.includes(type)) actions.push(type);
	};
	const segment = segmentAt(state, index);
	for (const tile of state.tiles.filter((item) => item.segment === index)) {
		if (tile.landUse === 'factory' && !has(tile, 'ipal_industrial')) add('ipal_industrial');
		if (tile.landUse === 'settlement' || tile.landUse === 'dense_settlement') {
			if (!has(tile, 'ipal_communal')) add('ipal_communal');
			if (!has(tile, 'waste_bank')) add('waste_bank');
		}
		if (tile.landUse === 'paddy' && !has(tile, 'eco_farming')) add('eco_farming');
		if (tile.landUse === 'open_land') add('plant_forest');
	}
	if (!segment.interventions.some((item) => item.type === 'greenbelt')) add('greenbelt');
	if (segment.litter >= HIGH_LITTER) add('river_cleanup');
	if (segment.hyacinth >= HIGH_HYACINTH) add('clear_hyacinth');
	if (segment.floodRatio >= HIGH_FLOOD_RATIO) add('retention_pond');
	return actions.slice(0, MAX_ACTIONS);
}

function detailOf(trigger: DetectedTrigger): string {
	if (trigger.kind === 'event' && isEventType(trigger.detail)) {
		return eventNames[trigger.detail];
	}
	if (trigger.kind === 'fish_extinct') {
		const group = fishGroups.find((item) => item === trigger.detail);
		return group === undefined ? '' : fishGroupNames[group].toLowerCase();
	}
	if (trigger.kind === 'intervention_effect' && trigger.action !== null) {
		return actionNames[trigger.action.type];
	}
	return '';
}

export function buildNarrationPayload(input: PayloadInput): NarrationPayload {
	const { trigger, current, baseline } = input;
	const primary = trigger.segments[0] ?? worstSegmentOf(current);
	const ids = trigger.segments.length > 0 ? trigger.segments : [primary];
	const causes: CausePayload[] = loadCauses(input.causes(primary), primary);
	if (trigger.kind === 'event') causes.push({ type: 'event', event: detailOf(trigger) });
	if (trigger.kind === 'intervention_effect') {
		causes.push({
			type: 'intervention',
			action: detailOf(trigger),
			monthsActive: INTERVENTION_EFFECT_DELAY_MONTHS
		});
	}
	causes.push({ type: 'season', flowFactor: roundTo(flowFactorOf(input.calendarMonth), 2) });
	return {
		kind: 'change',
		audience: input.audience,
		month: current.month,
		calendarMonth: monthNames[input.calendarMonth - 1] ?? '',
		season: seasonNames[input.season],
		trigger: trigger.kind,
		detail: detailOf(trigger),
		segments: [...new Set(ids)].map((id) => segmentPayload(current, baseline, id)),
		causes,
		indicators: {
			waterQuality: Math.round(current.indicators.waterQuality),
			fish: Math.round(current.indicators.fish),
			floodRisk: Math.round(current.indicators.floodRisk),
			economy: Math.round(current.indicators.economy)
		},
		availableActions: availableActionsFor(current, primary)
	};
}
