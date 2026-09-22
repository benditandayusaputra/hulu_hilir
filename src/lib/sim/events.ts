import { heavyRainChanceOf, seasonOf } from './calendar';
import {
	CLOUD_COVER_DAILY_VARIATION,
	COMMUNITY_CHANCE,
	COMMUNITY_MAX_LITTER,
	COMMUNITY_MIN_WASTE_BANKS,
	DROUGHT_CHANCE,
	DROUGHT_COOLDOWN_MONTHS,
	DROUGHT_MAX_DURATION,
	DROUGHT_MIN_DURATION,
	EVENT_COOLDOWN_MONTHS,
	EXTREME_RAIN_CHANCE,
	EXTREME_RAIN_INTENSITY,
	HEAVY_RAIN_INTENSITY,
	ILLEGAL_DUMPING_CHANCE_PER_FACTORY,
	ILLEGAL_DUMPING_ENFORCEMENT_FACTOR,
	LANDSLIDE_CHANCE,
	LITTER_COMMUNITY_CLEANUP,
	droughtMonths
} from './constants';
import { hasActive } from './loads';
import type { RngStream } from './rng';
import type { EventType, MonthEvent, ScheduledEvent, SegmentIndex, SimState } from './types';

export interface EventRoll {
	events: MonthEvent[];
	rainIntensity: number;
	rainDay: number;
	cloudVariation: number;
	lastEventMonth: Partial<Record<EventType, number>>;
}

interface RollContext {
	state: SimState;
	month: number;
	calendarMonth: number;
	daysInMonth: number;
	rng: RngStream;
	scheduled: readonly ScheduledEvent[];
	last: Partial<Record<EventType, number>>;
	events: MonthEvent[];
	negativeFired: boolean;
}

function scheduledOf(context: RollContext, type: EventType): ScheduledEvent | undefined {
	return context.scheduled.find((item) => item.type === type);
}

function cooledDown(context: RollContext, type: EventType, gap: number): boolean {
	const last = context.last[type];
	return last === undefined || context.month - last >= gap;
}

function fire(
	context: RollContext,
	type: EventType,
	segment: SegmentIndex | null,
	value: number
): void {
	context.events.push({ type, month: context.month, segment, value });
	context.last[type] = context.month;
}

function rollRain(context: RollContext): number {
	const heavy =
		context.rng.chance(heavyRainChanceOf(context.calendarMonth)) ||
		scheduledOf(context, 'heavy_rain') !== undefined;
	const extremeRoll = context.rng.chance(EXTREME_RAIN_CHANCE);
	const extreme =
		(seasonOf(context.calendarMonth) === 'wet' && extremeRoll) ||
		scheduledOf(context, 'extreme_rain') !== undefined;
	if (extreme) {
		fire(context, 'extreme_rain', null, EXTREME_RAIN_INTENSITY);
		return EXTREME_RAIN_INTENSITY;
	}
	if (heavy) {
		fire(context, 'heavy_rain', null, HEAVY_RAIN_INTENSITY);
		return HEAVY_RAIN_INTENSITY;
	}
	return 0;
}

function rollDrought(context: RollContext): void {
	const roll = context.rng.chance(DROUGHT_CHANCE);
	const duration = Math.floor(context.rng.range(DROUGHT_MIN_DURATION, DROUGHT_MAX_DURATION + 1));
	const eligible =
		context.state.droughtMonthsLeft === 0 &&
		droughtMonths.includes(context.calendarMonth) &&
		cooledDown(context, 'drought', DROUGHT_COOLDOWN_MONTHS);
	const scheduled = scheduledOf(context, 'drought') !== undefined;
	if (!scheduled && !(eligible && roll && !context.negativeFired)) return;
	fire(context, 'drought', null, duration);
	context.negativeFired = true;
}

function rollIllegalDumping(context: RollContext): void {
	const { state, month } = context;
	const enforcement = hasActive(state.riverInterventions, 'enforcement', month, state.upkeepPaid);
	const chance =
		ILLEGAL_DUMPING_CHANCE_PER_FACTORY * (enforcement ? ILLEGAL_DUMPING_ENFORCEMENT_FACTOR : 1);
	const factories = state.tiles.filter(
		(tile) =>
			tile.landUse === 'factory' &&
			!hasActive(tile.interventions, 'ipal_industrial', month, state.upkeepPaid)
	);
	let target: SegmentIndex | null = null;
	for (const tile of factories) {
		const roll = context.rng.chance(chance);
		if (roll && target === null) target = tile.segment;
	}
	const scheduled = scheduledOf(context, 'illegal_dumping');
	if (scheduled) {
		const segment = scheduled.segment ?? factories[0]?.segment ?? null;
		if (segment !== null) fire(context, 'illegal_dumping', segment, 0);
		context.negativeFired = true;
		return;
	}
	if (
		target === null ||
		context.negativeFired ||
		!cooledDown(context, 'illegal_dumping', EVENT_COOLDOWN_MONTHS)
	) {
		return;
	}
	fire(context, 'illegal_dumping', target, 0);
	context.negativeFired = true;
}

function exposedSegments(state: SimState, month: number): SegmentIndex[] {
	return state.segments
		.filter((segment) => {
			const near = state.tiles.filter(
				(tile) => tile.segment === segment.index && tile.position === 1
			);
			const forested = near.some((tile) => tile.landUse === 'forest');
			const greenbelt = hasActive(segment.interventions, 'greenbelt', month, state.upkeepPaid);
			return !forested && !greenbelt;
		})
		.map((segment) => segment.index);
}

function rollLandslide(context: RollContext, rainIntensity: number): void {
	const scheduled = scheduledOf(context, 'landslide');
	if (scheduled?.segment !== undefined) {
		fire(context, 'landslide', scheduled.segment, 0);
		context.negativeFired = true;
		return;
	}
	if (rainIntensity === 0) return;
	let target: SegmentIndex | null = null;
	for (const index of exposedSegments(context.state, context.month)) {
		const roll = context.rng.chance(LANDSLIDE_CHANCE);
		if (roll && target === null) target = index;
	}
	if (
		target === null ||
		context.negativeFired ||
		!cooledDown(context, 'landslide', EVENT_COOLDOWN_MONTHS)
	) {
		return;
	}
	fire(context, 'landslide', target, 0);
	context.negativeFired = true;
}

function rollCommunity(context: RollContext): void {
	const { state, month } = context;
	const roll = context.rng.chance(COMMUNITY_CHANCE);
	const banks = state.tiles.filter((tile) =>
		hasActive(tile.interventions, 'waste_bank', month, state.upkeepPaid)
	);
	const candidates = state.segments
		.filter(
			(segment) =>
				segment.litter < COMMUNITY_MAX_LITTER &&
				banks.some((tile) => tile.segment === segment.index)
		)
		.map((segment) => segment.index);
	const pick = context.rng.pickIndex(Math.max(1, candidates.length));
	if (!roll || banks.length < COMMUNITY_MIN_WASTE_BANKS || candidates.length === 0) return;
	if (!cooledDown(context, 'community', EVENT_COOLDOWN_MONTHS)) return;
	const segment = candidates[pick];
	if (segment !== undefined) fire(context, 'community', segment, LITTER_COMMUNITY_CLEANUP);
}

export function rollEvents(
	state: SimState,
	month: number,
	calendarMonth: number,
	daysInMonth: number,
	rng: RngStream
): EventRoll {
	const context: RollContext = {
		state,
		month,
		calendarMonth,
		daysInMonth,
		rng,
		scheduled: state.scenario.scheduledEvents.filter((item) => item.month === month),
		last: { ...state.lastEventMonth },
		events: [],
		negativeFired: false
	};
	const rainIntensity = rollRain(context);
	rollDrought(context);
	rollIllegalDumping(context);
	rollLandslide(context, rainIntensity);
	rollCommunity(context);
	const randomDay = rng.pickIndex(daysInMonth) + 1;
	const cloudVariation = rng.range(-CLOUD_COVER_DAILY_VARIATION, CLOUD_COVER_DAILY_VARIATION);
	const scheduledRain = context.scheduled.find(
		(item) => (item.type === 'extreme_rain' || item.type === 'heavy_rain') && item.day !== undefined
	);
	return {
		events: context.events,
		rainIntensity,
		rainDay: scheduledRain?.day ?? randomDay,
		cloudVariation,
		lastEventMonth: context.last
	};
}
