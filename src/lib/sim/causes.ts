import { segmentsTargetedBy } from './actions';
import { calendarMonthOf, flowFactorOf, tssRainFactorOf } from './calendar';
import { segmentFlows, travelTimeDays } from './hydrology';
import {
	hasActive,
	loadEntries,
	sumBySegment,
	zeroLoad,
	type LoadContext,
	type LoadEntry
} from './loads';
import {
	loadParameters,
	type CauseReport,
	type CauseShare,
	type LoadParameter,
	type SegmentIndex,
	type SimState
} from './types';
import { routeLoads, type SegmentPhysics } from './waterQuality';

interface TaggedContribution {
	source: LoadEntry['source'];
	segment: SegmentIndex | null;
	amounts: Record<LoadParameter, number>;
}

function physicsOf(state: SimState): SegmentPhysics[] {
	const calendarMonth = calendarMonthOf(state.scenario.startDate, Math.max(1, state.month));
	const flows = segmentFlows(flowFactorOf(calendarMonth), state.droughtActive);
	return state.segments.map((segment, i) => ({
		index: segment.index,
		flow: flows[i] ?? 0,
		travelTime: travelTimeDays(segment.index),
		temperature: segment.temperature,
		hyacinth: segment.hyacinth,
		sediment: segment.sediment,
		tssMultiplier: 1,
		coliformMultiplier: 1
	}));
}

function loadContextOf(state: SimState): LoadContext {
	const month = Math.max(1, state.month);
	return {
		month,
		tssRainFactor: tssRainFactorOf(calendarMonthOf(state.scenario.startDate, month)),
		upkeepPaid: state.upkeepPaid,
		greenbeltMaturity: state.segments.map((segment) =>
			hasActive(segment.interventions, 'greenbelt', month, state.upkeepPaid)
				? segment.greenbeltMaturity
				: 0
		),
		events: state.events,
		sealedSegments: segmentsTargetedBy(state.actions, 'seal_illegal_outlet')
	};
}

function contributionOf(
	entries: readonly LoadEntry[],
	physics: readonly SegmentPhysics[],
	target: SegmentIndex,
	background: boolean
): Record<LoadParameter, number> {
	const loads = sumBySegment(entries);
	const routed = routeLoads(loads, physics, background ? undefined : zeroLoad);
	const out = routed.out[target - 1] ?? zeroLoad;
	const amounts = { ...zeroLoad };
	for (const key of loadParameters) amounts[key] = out[key];
	return amounts;
}

function groupKey(entry: LoadEntry): string {
	return `${entry.source}@${entry.segment}`;
}

export function attributeCauses(state: SimState, target: SegmentIndex): CauseReport {
	const physics = physicsOf(state);
	const entries = loadEntries(state.tiles, loadContextOf(state)).filter(
		(entry) => entry.segment <= target
	);
	const groups = new Map<string, LoadEntry[]>();
	for (const entry of entries) {
		const list = groups.get(groupKey(entry)) ?? [];
		list.push(entry);
		groups.set(groupKey(entry), list);
	}
	const contributions: TaggedContribution[] = [];
	for (const list of groups.values()) {
		const first = list[0];
		if (!first) continue;
		contributions.push({
			source: first.source,
			segment: first.segment,
			amounts: contributionOf(list, physics, target, false)
		});
	}
	contributions.push({
		source: 'background',
		segment: null,
		amounts: contributionOf([], physics, target, true)
	});
	return {
		bod: sharesOf(contributions, 'bod'),
		tss: sharesOf(contributions, 'tss'),
		nitrate: sharesOf(contributions, 'nitrate'),
		phosphate: sharesOf(contributions, 'phosphate'),
		fecalColiform: sharesOf(contributions, 'fecalColiform'),
		chromium: sharesOf(contributions, 'chromium')
	};
}

function sharesOf(contributions: readonly TaggedContribution[], key: LoadParameter): CauseShare[] {
	const total = contributions.reduce((sum, item) => sum + item.amounts[key], 0);
	return contributions
		.filter((item) => item.amounts[key] > 0)
		.map((item) => ({
			source: item.source,
			segment: item.segment,
			share: total > 0 ? item.amounts[key] / total : 0
		}))
		.sort((left, right) => right.share - left.share);
}
