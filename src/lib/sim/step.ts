import { applyAction, segmentsTargetedBy, settleRelocations } from './actions';
import {
	calendarDateOfMonth,
	cloudCoverOf,
	daysInMonth,
	flowFactorOf,
	tssRainFactorOf
} from './calendar';
import {
	DREDGING_TSS_MULTIPLIER,
	ECOTOURISM_GOOD_MONTHS,
	ECOTOURISM_MAX_LITTER,
	FLOOD_COLIFORM_MULTIPLIER,
	FLOOD_TSS_MULTIPLIER,
	HEAVY_RAIN_INTENSITY,
	HYACINTH_BLOOM_THRESHOLD,
	ROB_FLOOD_EQUIVALENT_RATIO,
	TIDE_CHECK_HOUR
} from './constants';
import {
	biomassOf,
	dailyExtremes,
	isRobFlood,
	maxTideInMonth,
	tideAtHour,
	tideCapacityFactor
} from './daily';
import {
	economyOf,
	economyScore,
	finesOf,
	monthlyUpkeep,
	settleCash,
	untreatedFactories
} from './economy';
import { rollEvents, type EventRoll } from './events';
import { fishScore, suitabilityOf, updateSegmentFish } from './fish';
import {
	effectiveCapacity,
	floodImpact,
	floodRiskScore,
	floodStatusOf,
	peakFlows,
	type TileRunoff
} from './flood';
import { segmentFlows, travelTimeDays } from './hydrology';
import { hasActive, loadEntries, runoffOf, sumBySegment, type LoadContext } from './loads';
import {
	lengthWeightedAverage,
	pollutionIndexOf,
	statusOf,
	waterQualityScore
} from './pollutionIndex';
import { RngStream } from './rng';
import {
	matureForest,
	matureGreenbelt,
	updateHyacinth,
	updateLitter,
	updateSediment
} from './stocks';
import {
	fishGroups,
	type Action,
	type Concentrations,
	type FishGroup,
	type FloodStatus,
	type Indicators,
	type MonthEvent,
	type NotableChange,
	type SegmentIndex,
	type SegmentState,
	type SimState,
	type StepResult,
	type TileState
} from './types';
import {
	routeLoads,
	routeOxygen,
	segmentTemperature,
	shadeOf,
	type SegmentPhysics
} from './waterQuality';

export interface MonthContext {
	month: number;
	calendarMonth: number;
	year: number;
	upkeepPaid: boolean;
	drought: boolean;
	events: readonly MonthEvent[];
	rainIntensity: number;
	rainDay: number;
	cloud: number;
	dredged: ReadonlySet<SegmentIndex>;
	cleaned: ReadonlySet<SegmentIndex>;
	cleared: ReadonlySet<SegmentIndex>;
	sealed: ReadonlySet<SegmentIndex>;
}

export interface SegmentAssessment {
	concentrations: Concentrations;
	doSaturation: number;
	reaeration: number;
	temperature: number;
	shade: number;
	flow: number;
	settledTss: number;
	pollutionIndex: number;
	floodRatio: number;
	floodStatus: FloodStatus;
	realRatio: number;
	flooded: boolean;
	doDawn: number;
	doDayMax: number;
}

export interface RiverAssessment {
	segments: SegmentAssessment[];
	floodRisk: number;
	robFlood: boolean;
}

interface FloodAssessment {
	stressRatios: number[];
	realRatios: number[];
	robFlood: boolean;
}

function activeGreenbelt(segment: SegmentState, context: MonthContext): number {
	const active = hasActive(segment.interventions, 'greenbelt', context.month, context.upkeepPaid);
	return active ? segment.greenbeltMaturity : 0;
}

function segmentTiles(tiles: readonly TileState[], index: SegmentIndex): TileState[] {
	return tiles.filter((tile) => tile.segment === index);
}

function assessFlood(
	state: SimState,
	tiles: readonly TileState[],
	flows: readonly number[],
	context: MonthContext
): FloodAssessment {
	const runoffs: TileRunoff[] = tiles.map((tile) => ({
		segment: tile.segment,
		runoff: runoffOf(tile, context.month, context.upkeepPaid)
	}));
	const retention = new Set<SegmentIndex>();
	for (const segment of state.segments) {
		if (hasActive(segment.interventions, 'retention_pond', context.month, context.upkeepPaid)) {
			retention.add(segment.index);
		}
	}
	const capacityOf = (segment: SegmentState, tideFactor: number): number =>
		effectiveCapacity(
			segment.index,
			segment.sediment,
			segment.litter,
			segment.hyacinth,
			tideFactor
		);
	const stressPeaks = peakFlows(flows, runoffs, HEAVY_RAIN_INTENSITY, retention);
	const stressRatios = state.segments.map(
		(segment, i) => (stressPeaks[i] ?? 0) / capacityOf(segment, 1)
	);
	const date = {
		...calendarDateOfMonth(state.scenario.startDate, context.month),
		day: context.rainDay
	};
	const tide = tideAtHour(date, TIDE_CHECK_HOUR, state.scenario.seaLevelRise);
	const realPeaks = peakFlows(flows, runoffs, context.rainIntensity, retention);
	const realRatios = state.segments.map((segment, i) => {
		if (context.rainIntensity === 0) return 0;
		const floodgate = hasActive(
			segment.interventions,
			'floodgate',
			context.month,
			context.upkeepPaid
		);
		return (
			(realPeaks[i] ?? 0) / capacityOf(segment, tideCapacityFactor(segment.index, tide, floodgate))
		);
	});
	const estuary = state.segments[state.segments.length - 1];
	const gate = estuary
		? hasActive(estuary.interventions, 'floodgate', context.month, context.upkeepPaid)
		: false;
	const maxTide = maxTideInMonth(context.year, context.calendarMonth, state.scenario.seaLevelRise);
	return { stressRatios, realRatios, robFlood: isRobFlood(maxTide, gate) };
}

function buildPhysics(
	state: SimState,
	tiles: readonly TileState[],
	flows: readonly number[],
	flood: FloodAssessment,
	context: MonthContext
): SegmentPhysics[] {
	return state.segments.map((segment, i) => {
		const shade = shadeOf(segmentTiles(tiles, segment.index), activeGreenbelt(segment, context));
		const flooded = (flood.realRatios[i] ?? 0) > 1;
		const dredged = context.dredged.has(segment.index);
		return {
			index: segment.index,
			flow: flows[i] ?? 0,
			travelTime: travelTimeDays(segment.index),
			temperature: segmentTemperature(segment.index, shade, context.drought),
			hyacinth: segment.hyacinth,
			sediment: segment.sediment,
			tssMultiplier: (flooded ? FLOOD_TSS_MULTIPLIER : 1) * (dredged ? DREDGING_TSS_MULTIPLIER : 1),
			coliformMultiplier: flooded ? FLOOD_COLIFORM_MULTIPLIER : 1
		};
	});
}

export function assessRiver(
	state: SimState,
	tiles: readonly TileState[],
	context: MonthContext
): RiverAssessment {
	const flows = segmentFlows(flowFactorOf(context.calendarMonth), context.drought);
	const flood = assessFlood(state, tiles, flows, context);
	const physics = buildPhysics(state, tiles, flows, flood, context);
	const loadContext: LoadContext = {
		month: context.month,
		tssRainFactor: tssRainFactorOf(context.calendarMonth),
		upkeepPaid: context.upkeepPaid,
		greenbeltMaturity: state.segments.map((segment) => activeGreenbelt(segment, context)),
		events: context.events,
		sealedSegments: context.sealed
	};
	const routed = routeLoads(sumBySegment(loadEntries(tiles, loadContext)), physics);
	const oxygen = routeOxygen(
		routed.mixed.map((mix) => mix.bod),
		physics
	);
	const segments = state.segments.map((segment, i): SegmentAssessment => {
		const out = routed.out[i];
		const mix = routed.mixed[i];
		const air = oxygen[i];
		const body = physics[i];
		if (!out || !mix || !air || !body) throw new Error('segment assessment out of range');
		const concentrations: Concentrations = { do: air.dissolved, ...out };
		const daily = dailyExtremes({
			doMonthly: air.dissolved,
			doSaturation: air.saturation,
			reaeration: air.reaeration,
			biomass: biomassOf(out.phosphate, out.tss, segment.hyacinth),
			cloud: context.cloud,
			temperature: body.temperature
		});
		const realRatio = flood.realRatios[i] ?? 0;
		const stressRatio = flood.stressRatios[i] ?? 0;
		return {
			concentrations,
			doSaturation: air.saturation,
			reaeration: air.reaeration,
			temperature: body.temperature,
			shade: shadeOf(segmentTiles(tiles, segment.index), activeGreenbelt(segment, context)),
			flow: body.flow,
			settledTss: mix.tss - out.tss,
			pollutionIndex: pollutionIndexOf(concentrations, air.saturation),
			floodRatio: stressRatio,
			floodStatus: context.rainIntensity > 0 ? floodStatusOf(realRatio) : 'safe',
			realRatio,
			flooded: realRatio > 1,
			doDawn: daily.doDawn,
			doDayMax: daily.doDayMax
		};
	});
	return { segments, floodRisk: floodRiskScore(flood.stressRatios), robFlood: flood.robFlood };
}

interface AcceptedActions {
	state: SimState;
	accepted: Action[];
}

function acceptActions(
	state: SimState,
	actions: readonly Action[],
	month: number
): AcceptedActions {
	let working = state;
	const accepted: Action[] = [];
	for (const action of actions) {
		const stamped = { ...action, month };
		const result = applyAction(working, stamped);
		if (!result.ok) continue;
		working = result.value;
		accepted.push(stamped);
	}
	return { state: working, accepted };
}

function buildContext(
	state: SimState,
	month: number,
	upkeepPaid: boolean,
	drought: boolean,
	roll: EventRoll,
	actions: readonly Action[]
): MonthContext {
	const date = calendarDateOfMonth(state.scenario.startDate, month);
	const cloud = Math.min(1, Math.max(0, cloudCoverOf(date.month) + roll.cloudVariation));
	return {
		month,
		calendarMonth: date.month,
		year: date.year,
		upkeepPaid,
		drought,
		events: roll.events,
		rainIntensity: roll.rainIntensity,
		rainDay: roll.rainDay,
		cloud,
		dredged: segmentsTargetedBy(actions, 'dredging'),
		cleaned: segmentsTargetedBy(actions, 'river_cleanup'),
		cleared: segmentsTargetedBy(actions, 'clear_hyacinth'),
		sealed: segmentsTargetedBy(actions, 'seal_illegal_outlet')
	};
}

interface FloodOutcome {
	events: MonthEvent[];
	affectedResidents: number;
	losses: number;
	failedPaddies: Set<SegmentIndex>;
	flooded: Set<SegmentIndex>;
}

function settleFloods(
	state: SimState,
	tiles: readonly TileState[],
	assessment: RiverAssessment,
	month: number
): FloodOutcome {
	const outcome: FloodOutcome = {
		events: [],
		affectedResidents: 0,
		losses: 0,
		failedPaddies: new Set(),
		flooded: new Set()
	};
	assessment.segments.forEach((segment, i) => {
		const index = state.segments[i]?.index;
		if (index === undefined || !segment.flooded) return;
		const impact = floodImpact(segmentTiles(tiles, index), segment.realRatio);
		outcome.events.push({ type: 'flood', month, segment: index, value: segment.realRatio });
		outcome.affectedResidents += impact.affectedResidents;
		outcome.losses += impact.losses;
		outcome.flooded.add(index);
		if (impact.failedPaddies > 0) outcome.failedPaddies.add(index);
	});
	const estuary = state.segments[state.segments.length - 1];
	if (assessment.robFlood && estuary) {
		const homes = segmentTiles(tiles, estuary.index);
		const impact = floodImpact(homes, ROB_FLOOD_EQUIVALENT_RATIO);
		outcome.events.push({
			type: 'rob_flood',
			month,
			segment: estuary.index,
			value: impact.affectedResidents
		});
		outcome.affectedResidents += impact.affectedResidents;
		outcome.losses += impact.losses;
	}
	return outcome;
}

interface SegmentUpdate {
	segment: SegmentState;
	events: MonthEvent[];
	changes: NotableChange[];
}

function suitabilityFor(
	assessment: SegmentAssessment,
	hyacinth: number
): Record<FishGroup, number> {
	const input = {
		doDawn: assessment.doDawn,
		chromium: assessment.concentrations.chromium,
		tss: assessment.concentrations.tss,
		temperature: assessment.temperature,
		hyacinth
	};
	const result = { sensitive: 0, intermediate: 0, tolerant: 0 };
	for (const group of fishGroups) result[group] = suitabilityOf(group, input);
	return result;
}

function updateSegment(
	state: SimState,
	i: number,
	assessment: SegmentAssessment,
	context: MonthContext,
	floods: FloodOutcome,
	litter: number
): SegmentUpdate {
	const previous = state.segments[i];
	if (!previous) throw new Error('segment index out of range');
	const events: MonthEvent[] = [];
	const changes: NotableChange[] = [];
	const status = statusOf(assessment.pollutionIndex);
	if (status !== previous.status) {
		changes.push({
			kind: 'status_change',
			segment: previous.index,
			before: previous.status,
			after: status
		});
	}
	const landslide = context.events.some(
		(event) => event.type === 'landslide' && event.segment === previous.index
	);
	const sediment = updateSediment(previous.sediment, {
		settledTss: assessment.settledTss,
		flowFactor: flowFactorOf(context.calendarMonth),
		flooded: floods.flooded.has(previous.index),
		landslide,
		dredged: context.dredged.has(previous.index)
	});
	const hyacinth = updateHyacinth(
		previous.hyacinth,
		previous.index,
		assessment.concentrations.phosphate,
		context.cleared.has(previous.index)
	);
	if (previous.hyacinth < HYACINTH_BLOOM_THRESHOLD && hyacinth >= HYACINTH_BLOOM_THRESHOLD) {
		events.push({
			type: 'hyacinth_bloom',
			month: context.month,
			segment: previous.index,
			value: hyacinth
		});
	}
	if (floods.flooded.has(previous.index)) {
		events.push({
			type: 'litter_shipment',
			month: context.month,
			segment: previous.index,
			value: 0
		});
	}
	const fish = updateSegmentFish(
		previous.fish,
		suitabilityFor(assessment, previous.hyacinth),
		assessment.shade,
		state.segments[i - 1]?.fish ?? null,
		state.segments[i + 1]?.fish ?? null,
		previous.sensitiveLost
	);
	if (fish.killed) {
		events.push({ type: 'fish_kill', month: context.month, segment: previous.index, value: 0 });
		changes.push({ kind: 'fish_kill', segment: previous.index, before: '', after: '' });
	}
	if (fish.returned) {
		events.push({ type: 'fish_return', month: context.month, segment: previous.index, value: 0 });
		changes.push({ kind: 'fish_return', segment: previous.index, before: '', after: 'sensitive' });
	}
	for (const group of fish.extinct) {
		changes.push({ kind: 'fish_extinct', segment: previous.index, before: group, after: '' });
	}
	const goodStreak = status === 'good' ? previous.goodStreak + 1 : 0;
	const ecotourism =
		previous.ecotourism || (goodStreak >= ECOTOURISM_GOOD_MONTHS && litter < ECOTOURISM_MAX_LITTER);
	if (ecotourism && !previous.ecotourism) {
		events.push({ type: 'ecotourism', month: context.month, segment: previous.index, value: 0 });
	}
	const greenbeltInstalled = hasActive(
		previous.interventions,
		'greenbelt',
		context.month,
		context.upkeepPaid
	);
	const segment: SegmentState = {
		...previous,
		flow: assessment.flow,
		temperature: assessment.temperature,
		shade: assessment.shade,
		concentrations: assessment.concentrations,
		doSaturation: assessment.doSaturation,
		doDawn: assessment.doDawn,
		doDayMax: assessment.doDayMax,
		pollutionIndex: assessment.pollutionIndex,
		status,
		sediment,
		litter,
		hyacinth,
		greenbeltMaturity: matureGreenbelt(previous.greenbeltMaturity, greenbeltInstalled),
		fish: fish.fish,
		sensitiveLost: fish.sensitiveLost,
		floodRatio: assessment.floodRatio,
		floodStatus: assessment.floodStatus,
		goodStreak,
		ecotourism,
		settledTss: assessment.settledTss
	};
	return { segment, events, changes };
}

export function indicatorsOf(
	segments: readonly SegmentState[],
	floodRisk: number,
	economy: number
): Indicators {
	return {
		waterQuality: lengthWeightedAverage(segments.map((s) => waterQualityScore(s.pollutionIndex))),
		fish: lengthWeightedAverage(segments.map((s) => fishScore(s.fish))),
		floodRisk,
		economy
	};
}

function eventChanges(events: readonly MonthEvent[]): NotableChange[] {
	return events
		.filter(
			(event) =>
				event.type !== 'flood' && event.type !== 'fish_kill' && event.type !== 'fish_return'
		)
		.map((event) => ({ kind: 'event', segment: event.segment, before: '', after: event.type }));
}

export function stepMonth(state: SimState, actions: readonly Action[]): StepResult {
	const month = state.month + 1;
	const accepted = acceptActions(state, actions, month);
	const applied = accepted.state;
	const tiles = settleRelocations(applied.tiles, month);
	const allocation = state.scenario.budget?.monthly ?? 0;
	const enforcement = hasActive(applied.riverInterventions, 'enforcement', month, true);
	const untreatedBefore = untreatedFactories(tiles, month, true);
	const upkeep = monthlyUpkeep(
		tiles,
		applied.segments.map((segment) => segment.interventions),
		applied.riverInterventions,
		month
	);
	const cash = settleCash(applied.cash, allocation, finesOf(untreatedBefore, enforcement), upkeep);
	const prepared: SimState = { ...applied, tiles, upkeepPaid: cash.upkeepPaid };
	const date = calendarDateOfMonth(state.scenario.startDate, month);
	const rng = new RngStream(state.rngState);
	const roll = rollEvents(prepared, month, date.month, daysInMonth(date.year, date.month), rng);
	const droughtEvent = roll.events.find((event) => event.type === 'drought');
	const droughtActive = droughtEvent !== undefined || state.droughtMonthsLeft > 0;
	const droughtMonthsLeft = droughtEvent
		? droughtEvent.value - 1
		: Math.max(0, state.droughtMonthsLeft - 1);
	const context = buildContext(
		prepared,
		month,
		cash.upkeepPaid,
		droughtActive,
		roll,
		accepted.accepted
	);
	const assessment = assessRiver(prepared, tiles, context);
	const floods = settleFloods(prepared, tiles, assessment, month);
	const community = new Set<SegmentIndex>();
	for (const event of roll.events) {
		if (event.type === 'community' && event.segment !== null) community.add(event.segment);
	}
	const litter = updateLitter(
		prepared.segments.map((segment) => segment.litter),
		tiles,
		{
			month,
			upkeepPaid: cash.upkeepPaid,
			flooded: floods.flooded,
			cleaned: context.cleaned,
			community
		}
	);
	const updates = assessment.segments.map((segment, i) =>
		updateSegment(prepared, i, segment, context, floods, litter.litter[i] ?? 0)
	);
	const segments = updates.map((update) => update.segment);
	const ecotourism = new Set<SegmentIndex>();
	for (const segment of segments) if (segment.ecotourism) ecotourism.add(segment.index);
	const economy = economyOf({
		tiles,
		month,
		upkeepPaid: cash.upkeepPaid,
		ecotourism,
		failedPaddies: floods.failedPaddies
	});
	const untreated = untreatedFactories(tiles, month, cash.upkeepPaid);
	const enforcementActive = hasActive(
		prepared.riverInterventions,
		'enforcement',
		month,
		cash.upkeepPaid
	);
	const economyIndicator = economyScore(economy, state.baseline, untreated, enforcementActive);
	const events = [...roll.events, ...floods.events, ...updates.flatMap((update) => update.events)];
	const changes = [
		...updates.flatMap((update) => update.changes),
		...floods.events
			.filter((event) => event.type === 'flood')
			.map((event): NotableChange => ({
				kind: 'flood',
				segment: event.segment,
				before: '',
				after: String(event.value)
			})),
		...eventChanges(roll.events)
	];
	const next: SimState = {
		...prepared,
		month,
		rngState: rng.state,
		tiles: tiles.map(matureForest),
		segments,
		cash: cash.cash,
		cashReceived: prepared.cashReceived + cash.received,
		upkeepPaid: cash.upkeepPaid,
		economy,
		indicators: indicatorsOf(segments, assessment.floodRisk, economyIndicator),
		droughtMonthsLeft,
		droughtActive,
		lastEventMonth: roll.lastEventMonth,
		litterToSea: litter.toSea,
		litterToSeaTotal: prepared.litterToSeaTotal + litter.toSea,
		affectedResidents: floods.affectedResidents,
		losses: floods.losses,
		events,
		changes,
		actions: accepted.accepted
	};
	return { state: next, events, changes };
}
