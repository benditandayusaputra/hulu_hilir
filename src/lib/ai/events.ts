import { eventTypes, type EventType, type NotableChange, type SegmentIndex } from '$lib/sim';

export interface PendingEvent {
	type: EventType;
	segment: SegmentIndex | null;
	month: number;
}

const routineEvents: readonly EventType[] = ['heavy_rain'];

export function isEventType(value: string): value is EventType {
	return eventTypes.some((type) => type === value);
}

export function dialogEventOf(
	changes: readonly NotableChange[],
	month: number
): PendingEvent | null {
	const flood = changes.find((change) => change.kind === 'flood');
	if (flood) return { type: 'flood', segment: flood.segment, month };
	const kill = changes.find((change) => change.kind === 'fish_kill');
	if (kill) return { type: 'fish_kill', segment: kill.segment, month };
	for (const change of changes) {
		if (change.kind !== 'event' || !isEventType(change.after)) continue;
		if (routineEvents.includes(change.after)) continue;
		return { type: change.after, segment: change.segment, month };
	}
	return null;
}
