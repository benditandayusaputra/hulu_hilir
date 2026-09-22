import {
	actionSpecs,
	parseSegmentIndex,
	type Action,
	type NotableChange,
	type SegmentIndex,
	type SimState,
	type StepResult
} from '$lib/sim';
import type { NarrationTrigger } from './schemas';

export type TriggerPriority = 'high' | 'medium' | 'low';

export interface DetectedTrigger {
	kind: NarrationTrigger;
	priority: TriggerPriority;
	segments: SegmentIndex[];
	detail: string;
	action: Action | null;
}

export const INTERVENTION_EFFECT_DELAY_MONTHS = 3;
export const SUMMARY_INTERVAL_MONTHS = 12;
const routineEvents: ReadonlySet<string> = new Set(['heavy_rain']);
const silentActions: ReadonlySet<string> = new Set(['change_land_use', 'dismantle']);

function segmentsOf(change: NotableChange): SegmentIndex[] {
	return change.segment === null ? [] : [change.segment];
}

export function worstSegmentOf(state: SimState): SegmentIndex {
	let worst = state.segments[0];
	for (const segment of state.segments) {
		if (worst === undefined || segment.pollutionIndex > worst.pollutionIndex) worst = segment;
	}
	return worst?.index ?? 1;
}

export function segmentOfAction(action: Action, state: SimState): SegmentIndex {
	const tile = state.tiles.find((item) => item.id === action.target);
	if (tile !== undefined) return tile.segment;
	return parseSegmentIndex(action.target) ?? worstSegmentOf(state);
}

function interventionInstalledAt(snapshots: readonly SimState[], month: number): Action | null {
	if (month < 1) return null;
	const snapshot = snapshots.find((item) => item.month === month);
	if (snapshot === undefined) return null;
	return (
		snapshot.actions.find(
			(action) => !silentActions.has(action.type) && actionSpecs[action.type] !== undefined
		) ?? null
	);
}

export function detectTrigger(
	result: StepResult,
	snapshots: readonly SimState[]
): DetectedTrigger | null {
	const state = result.state;
	const changes = result.changes;
	const flood = changes.find((change) => change.kind === 'flood');
	if (flood) {
		return {
			kind: 'flood',
			priority: 'high',
			segments: segmentsOf(flood),
			detail: '',
			action: null
		};
	}
	const kill = changes.find((change) => change.kind === 'fish_kill');
	if (kill) {
		return {
			kind: 'fish_kill',
			priority: 'high',
			segments: segmentsOf(kill),
			detail: '',
			action: null
		};
	}
	const event = changes.find(
		(change) => change.kind === 'event' && !routineEvents.has(change.after)
	);
	if (event) {
		return {
			kind: 'event',
			priority: 'high',
			segments: segmentsOf(event),
			detail: event.after,
			action: null
		};
	}
	const statusChanges = changes.filter((change) => change.kind === 'status_change');
	if (statusChanges.length > 0) {
		return {
			kind: 'status_change',
			priority: 'medium',
			segments: statusChanges.flatMap(segmentsOf),
			detail: '',
			action: null
		};
	}
	const extinct = changes.find((change) => change.kind === 'fish_extinct');
	if (extinct) {
		return {
			kind: 'fish_extinct',
			priority: 'medium',
			segments: segmentsOf(extinct),
			detail: extinct.before,
			action: null
		};
	}
	const returned = changes.find((change) => change.kind === 'fish_return');
	if (returned) {
		return {
			kind: 'fish_return',
			priority: 'medium',
			segments: segmentsOf(returned),
			detail: '',
			action: null
		};
	}
	const installed = interventionInstalledAt(
		snapshots,
		state.month - INTERVENTION_EFFECT_DELAY_MONTHS
	);
	if (installed !== null) {
		return {
			kind: 'intervention_effect',
			priority: 'medium',
			segments: [segmentOfAction(installed, state)],
			detail: installed.type,
			action: installed
		};
	}
	if (state.month > 0 && state.month % SUMMARY_INTERVAL_MONTHS === 0) {
		return { kind: 'yearly_summary', priority: 'low', segments: [], detail: '', action: null };
	}
	return null;
}
