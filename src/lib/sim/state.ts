import {
	INITIAL_FISH_POPULATION,
	INITIAL_SEDIMENT,
	backgroundConcentration,
	segmentSpecs
} from './constants';
import { economyOf, economyScore } from './economy';
import { pollutionIndexOf, statusOf } from './pollutionIndex';
import { seedState } from './rng';
import { tileOrder } from './scenarios';
import { assessRiver, indicatorsOf, type MonthContext } from './step';
import {
	segmentIndices,
	type Scenario,
	type SegmentIndex,
	type SegmentState,
	type SimState,
	type TileState
} from './types';
import { doSaturationAt } from './waterQuality';

function tileFromId(id: (typeof tileOrder)[number], landUse: TileState['landUse']): TileState {
	const segment = segmentIndices.find((index) => id.startsWith(`S${index}-`)) ?? 1;
	const side = id.includes('-L') ? 'L' : 'R';
	const position = id.endsWith('1') ? 1 : 2;
	return { id, segment, side, position, landUse, forestMaturity: 1, interventions: [] };
}

export function buildTiles(scenario: Scenario): TileState[] {
	return tileOrder.map((id, i) => tileFromId(id, scenario.tiles[i] ?? 'forest'));
}

function initialSegment(scenario: Scenario, index: SegmentIndex): SegmentState {
	const overrides = scenario.segmentOverrides[index] ?? {};
	const doSaturation = doSaturationAt(segmentSpecs[index].baseTemperature);
	const concentrations = { do: doSaturation, ...backgroundConcentration };
	const pollutionIndex = pollutionIndexOf(concentrations, doSaturation);
	return {
		index,
		flow: segmentSpecs[index].baseFlow,
		temperature: segmentSpecs[index].baseTemperature,
		shade: 1,
		concentrations,
		doSaturation,
		doDawn: doSaturation,
		doDayMax: doSaturation,
		pollutionIndex,
		status: statusOf(pollutionIndex),
		sediment: overrides.sediment ?? INITIAL_SEDIMENT,
		litter: overrides.litter ?? 0,
		hyacinth: overrides.hyacinth ?? 0,
		greenbeltMaturity: 0,
		interventions: [],
		fish: {
			sensitive: overrides.fish?.sensitive ?? INITIAL_FISH_POPULATION,
			intermediate: overrides.fish?.intermediate ?? INITIAL_FISH_POPULATION,
			tolerant: overrides.fish?.tolerant ?? INITIAL_FISH_POPULATION
		},
		sensitiveLost: false,
		floodRatio: 0,
		floodStatus: 'safe',
		goodStreak: 0,
		ecotourism: false,
		settledTss: 0
	};
}

function previewContext(): MonthContext {
	const empty = new Set<SegmentIndex>();
	return {
		month: 0,
		calendarMonth: 1,
		year: 0,
		upkeepPaid: true,
		drought: false,
		events: [],
		rainIntensity: 0,
		rainDay: 1,
		cloud: 0,
		dredged: empty,
		cleaned: empty,
		cleared: empty,
		sealed: empty
	};
}

export function createInitialState(scenario: Scenario, seed: number): SimState {
	const tiles = buildTiles(scenario);
	const segments = segmentIndices.map((index) => initialSegment(scenario, index));
	const economy = economyOf({
		tiles,
		month: 0,
		upkeepPaid: true,
		ecotourism: new Set(),
		failedPaddies: new Set()
	});
	const raw: SimState = {
		scenario,
		month: 0,
		rngState: seedState(seed),
		tiles,
		segments,
		riverInterventions: [],
		cash: scenario.budget?.initial ?? null,
		cashReceived: scenario.budget?.initial ?? 0,
		upkeepPaid: true,
		economy,
		baseline: economy,
		indicators: { waterQuality: 0, fish: 0, floodRisk: 0, economy: 0 },
		droughtMonthsLeft: 0,
		lastEventMonth: {},
		litterToSea: 0,
		litterToSeaTotal: 0,
		affectedResidents: 0,
		losses: 0,
		events: [],
		changes: []
	};
	const context = {
		...previewContext(),
		calendarMonth: scenario.startDate.month,
		year: scenario.startDate.year
	};
	const preview = assessRiver(raw, tiles, context);
	const previewed = segments.map((segment, i): SegmentState => {
		const assessed = preview.segments[i];
		if (!assessed) return segment;
		return {
			...segment,
			flow: assessed.flow,
			temperature: assessed.temperature,
			shade: assessed.shade,
			concentrations: assessed.concentrations,
			doSaturation: assessed.doSaturation,
			doDawn: assessed.doDawn,
			doDayMax: assessed.doDayMax,
			pollutionIndex: assessed.pollutionIndex,
			status: statusOf(assessed.pollutionIndex),
			floodRatio: assessed.floodRatio
		};
	});
	return {
		...raw,
		segments: previewed,
		indicators: indicatorsOf(previewed, preview.floodRisk, economyScore(economy, economy, 0, false))
	};
}
