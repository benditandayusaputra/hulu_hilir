import {
	FISH_RETURN_THRESHOLD,
	INDICATOR_MAX,
	MAX_STARS,
	MONTHS_PER_YEAR,
	SCORE_CASH_WEIGHT,
	SCORE_INDICATOR_WEIGHT,
	SCORE_TARGET_WEIGHT,
	classTwoStandard
} from './constants';
import { statusRank } from './pollutionIndex';
import { finalState } from './replay';
import type {
	EventType,
	FishGroup,
	Indicators,
	MissionDefinition,
	MissionResult,
	MissionTarget,
	QualityParameter,
	SegmentIndex,
	SimHistory,
	SimState,
	StarLevel,
	TargetResult,
	WaterStatus
} from './types';

export type TargetCheck = MissionTarget['check'];
type Comparison = 'min' | 'max';

function compare(value: number, comparison: Comparison, limit: number): boolean {
	return comparison === 'min' ? value >= limit : value <= limit;
}

function segmentOf(state: SimState, index: SegmentIndex) {
	const segment = state.segments[index - 1];
	if (!segment) throw new Error(`segment ${index} tidak ada`);
	return segment;
}

export function monthsOfYear(history: SimHistory, year: number): SimState[] {
	const first = (year - 1) * MONTHS_PER_YEAR + 1;
	return history.snapshots.filter(
		(state) => state.month >= first && state.month <= first + MONTHS_PER_YEAR - 1
	);
}

export function indicatorAtEnd(
	metric: keyof Indicators,
	comparison: Comparison,
	limit: number
): TargetCheck {
	return (history) => compare(finalState(history).indicators[metric], comparison, limit);
}

export function segmentsStatusAtLeast(
	segments: readonly SegmentIndex[],
	status: WaterStatus
): TargetCheck {
	return (history) => {
		const state = finalState(history);
		return segments.every(
			(index) => statusRank(segmentOf(state, index).status) <= statusRank(status)
		);
	};
}

export function segmentsWithStatusAtEnd(status: WaterStatus, minimum: number): TargetCheck {
	return (history) =>
		finalState(history).segments.filter(
			(segment) => statusRank(segment.status) <= statusRank(status)
		).length >= minimum;
}

export function parameterAtEnd(
	segment: SegmentIndex,
	parameter: QualityParameter,
	comparison: Comparison,
	limit: number
): TargetCheck {
	return (history) =>
		compare(segmentOf(finalState(history), segment).concentrations[parameter], comparison, limit);
}

export function parameterMeetsStandard(
	segment: SegmentIndex,
	parameter: QualityParameter
): TargetCheck {
	const comparison: Comparison = parameter === 'do' ? 'min' : 'max';
	return parameterAtEnd(segment, parameter, comparison, classTwoStandard[parameter]);
}

export function litterAtEnd(segment: SegmentIndex, maximum: number): TargetCheck {
	return (history) => segmentOf(finalState(history), segment).litter <= maximum;
}

export function dawnOxygenAtEnd(segment: SegmentIndex, minimum: number): TargetCheck {
	return (history) => segmentOf(finalState(history), segment).doDawn >= minimum;
}

export function noEventInYear(type: EventType, year: number): TargetCheck {
	return (history) =>
		monthsOfYear(history, year).every(
			(state) => !state.events.some((event) => event.type === type)
		);
}

export function noAffectedResidentsInYear(year: number): TargetCheck {
	return (history) => monthsOfYear(history, year).every((state) => state.affectedResidents === 0);
}

export function fishPresentAtEnd(
	segment: SegmentIndex,
	group: FishGroup,
	minimum: number = FISH_RETURN_THRESHOLD
): TargetCheck {
	return (history) => segmentOf(finalState(history), segment).fish[group] >= minimum;
}

export function segmentsWithFishAtEnd(
	group: FishGroup,
	count: number,
	minimum: number = FISH_RETURN_THRESHOLD
): TargetCheck {
	return (history) =>
		finalState(history).segments.filter((segment) => segment.fish[group] >= minimum).length >=
		count;
}

export function yearlyTotal(
	history: SimHistory,
	year: number,
	metric: 'litterToSea' | 'affectedResidents'
): number {
	return monthsOfYear(history, year).reduce((sum, state) => sum + state[metric], 0);
}

export function reducedByHalfVsFirstYear(
	metric: 'litterToSea' | 'affectedResidents',
	lastYear: number
): TargetCheck {
	return (history) => {
		const first = yearlyTotal(history, 1, metric);
		const last = yearlyTotal(history, lastYear, metric);
		return first === 0 ? last === 0 : last <= first / 2;
	};
}

export function starsOf(results: readonly TargetResult[]): number {
	let stars = 0;
	for (let level = 1; level <= MAX_STARS; level += 1) {
		const atLevel = results.filter((result) => result.star === level);
		if (atLevel.length === 0 || atLevel.some((result) => !result.met)) break;
		stars = level;
	}
	return stars;
}

export function cashEfficiencyOf(state: SimState): number {
	if (state.cash === null || state.cashReceived <= 0) return 1;
	return Math.min(1, Math.max(0, state.cash / state.cashReceived));
}

export function indicatorAverage(indicators: Indicators): number {
	return (
		(indicators.waterQuality +
			indicators.fish +
			(INDICATOR_MAX - indicators.floodRisk) +
			indicators.economy) /
		4
	);
}

export function evaluateMission(history: SimHistory, mission: MissionDefinition): MissionResult {
	const targets = mission.targets.map((target): TargetResult => ({
		id: target.id,
		star: target.star,
		met: target.check(history)
	}));
	const stars = starsOf(targets);
	const state = finalState(history);
	const cashEfficiency = cashEfficiencyOf(state);
	const score =
		(SCORE_TARGET_WEIGHT * stars) / MAX_STARS +
		(SCORE_INDICATOR_WEIGHT * indicatorAverage(state.indicators)) / INDICATOR_MAX +
		SCORE_CASH_WEIGHT * cashEfficiency;
	return { score: Math.round(score), stars, targets, indicators: state.indicators, cashEfficiency };
}

export function target(id: string, star: StarLevel, check: TargetCheck): MissionTarget {
	return { id, star, check };
}
