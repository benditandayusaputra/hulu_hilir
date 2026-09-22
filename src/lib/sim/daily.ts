import { daysInMonth, julianDay } from './calendar';
import {
	BIOMASS_HYACINTH_SHARE,
	BIOMASS_MAX,
	BIOMASS_PHOSPHATE_UNIT,
	BIOMASS_TSS_CAP,
	BIOMASS_TSS_UNIT,
	CLOUD_LIGHT_LOSS,
	CLOUD_TEMPERATURE_LOSS,
	DAILY_DO_SATURATION_CAP,
	DAILY_STEPS,
	DAILY_WARMUP_DAYS,
	DAYLIGHT_HOURS,
	FLOODGATE_ROB_LIMIT,
	FLOODGATE_TIDE_REDUCTION,
	HOURS_PER_DAY,
	MOONRISE_BASE_HOUR,
	MOON_REFERENCE_JD,
	OXYGEN_PRODUCTION_BASE,
	OXYGEN_PRODUCTION_PER_BIOMASS,
	ROB_FLOOD_TIDE_THRESHOLD,
	SOLAR_PEAK,
	SUNRISE_HOUR,
	SYNODIC_MONTH_DAYS,
	TIDE_HIGH_BASE_HOUR,
	TIDE_MEAN_AMPLITUDE,
	TIDE_SPRING_FACTOR,
	WATER_TEMPERATURE_AMPLITUDE,
	WATER_TEMPERATURE_PEAK_OFFSET_HOUR,
	tideCapacityLoss
} from './constants';
import type { CalendarDate, SegmentIndex } from './types';

const NOON = 12;
const FULL_MOON_PHASE = 0.5;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function sunlight(hour: number, cloud: number): number {
	const elevation = Math.sin((Math.PI * (hour - SUNRISE_HOUR)) / DAYLIGHT_HOURS);
	return SOLAR_PEAK * Math.max(0, elevation) * (1 - CLOUD_LIGHT_LOSS * cloud);
}

export function dailyWaterTemperature(base: number, hour: number, cloud: number): number {
	const swing = Math.sin((Math.PI * (hour - WATER_TEMPERATURE_PEAK_OFFSET_HOUR)) / DAYLIGHT_HOURS);
	return base + WATER_TEMPERATURE_AMPLITUDE * swing * (1 - CLOUD_TEMPERATURE_LOSS * cloud);
}

export function biomassOf(phosphate: number, tss: number, hyacinth: number): number {
	const light = 1 - Math.min(tss, BIOMASS_TSS_CAP) / BIOMASS_TSS_UNIT;
	const value = (phosphate / BIOMASS_PHOSPHATE_UNIT) * light + BIOMASS_HYACINTH_SHARE * hyacinth;
	return clamp(value, 0, BIOMASS_MAX);
}

export function oxygenProduction(biomass: number, hour: number, cloud: number): number {
	return (
		((OXYGEN_PRODUCTION_BASE + OXYGEN_PRODUCTION_PER_BIOMASS * biomass) * sunlight(hour, cloud)) /
		SOLAR_PEAK
	);
}

export interface DailyInput {
	doMonthly: number;
	doSaturation: number;
	reaeration: number;
	biomass: number;
	cloud: number;
	temperature: number;
}

export interface DailyProfile {
	hours: number[];
	dissolvedOxygen: number[];
	temperature: number[];
	light: number[];
	doDawn: number;
	doDayMax: number;
}

export interface DailyExtremes {
	doDawn: number;
	doDayMax: number;
}

function hourOfStep(step: number): number {
	return (step * HOURS_PER_DAY) / DAILY_STEPS;
}

export function dailyOxygenSeries(input: DailyInput): number[] {
	const dt = 1 / DAILY_STEPS;
	const production: number[] = [];
	let mean = 0;
	for (let i = 0; i < DAILY_STEPS; i += 1) {
		const value = oxygenProduction(input.biomass, hourOfStep(i), input.cloud);
		production.push(value);
		mean += value / DAILY_STEPS;
	}
	const cap = DAILY_DO_SATURATION_CAP * input.doSaturation;
	let deviation = 0;
	const series: number[] = [];
	for (let day = 0; day < DAILY_WARMUP_DAYS; day += 1) {
		for (let i = 0; i < DAILY_STEPS; i += 1) {
			deviation += dt * ((production[i] ?? 0) - mean - input.reaeration * deviation);
			if (day === DAILY_WARMUP_DAYS - 1) series.push(clamp(input.doMonthly + deviation, 0, cap));
		}
	}
	return series;
}

export function dailyExtremes(input: DailyInput): DailyExtremes {
	let doDawn = Number.POSITIVE_INFINITY;
	let doDayMax = Number.NEGATIVE_INFINITY;
	for (const value of dailyOxygenSeries(input)) {
		if (value < doDawn) doDawn = value;
		if (value > doDayMax) doDayMax = value;
	}
	return { doDawn, doDayMax };
}

export function dailyProfile(input: DailyInput): DailyProfile {
	const hours = Array.from({ length: DAILY_STEPS }, (_, i) => hourOfStep(i));
	const dissolvedOxygen = dailyOxygenSeries(input);
	return {
		hours,
		dissolvedOxygen,
		temperature: hours.map((hour) => dailyWaterTemperature(input.temperature, hour, input.cloud)),
		light: hours.map((hour) => sunlight(hour, input.cloud)),
		doDawn: Math.min(...dissolvedOxygen),
		doDayMax: Math.max(...dissolvedOxygen)
	};
}

export function moonPhase(julianDayValue: number): number {
	const cycles = (julianDayValue - MOON_REFERENCE_JD) / SYNODIC_MONTH_DAYS;
	return ((cycles % 1) + 1) % 1;
}

export function moonPhaseOn(date: CalendarDate, hour: number = NOON): number {
	return moonPhase(julianDay(date, hour));
}

export function moonriseHour(phase: number): number {
	return (MOONRISE_BASE_HOUR + HOURS_PER_DAY * phase) % HOURS_PER_DAY;
}

export function tideAmplitude(phase: number): number {
	return TIDE_MEAN_AMPLITUDE * (1 + TIDE_SPRING_FACTOR * Math.cos(4 * Math.PI * phase));
}

export function tideHeight(hour: number, phase: number, seaLevelRise: number): number {
	const argument =
		(2 * Math.PI * (hour - TIDE_HIGH_BASE_HOUR - HOURS_PER_DAY * phase)) / HOURS_PER_DAY;
	return tideAmplitude(phase) * Math.cos(argument) + seaLevelRise;
}

export function tideAtHour(date: CalendarDate, hour: number, seaLevelRise: number): number {
	return tideHeight(hour, moonPhaseOn(date, hour), seaLevelRise);
}

export function maxTideInMonth(year: number, month: number, seaLevelRise: number): number {
	let highest = Number.NEGATIVE_INFINITY;
	for (let day = 1; day <= daysInMonth(year, month); day += 1) {
		const value = tideAmplitude(moonPhaseOn({ year, month, day })) + seaLevelRise;
		if (value > highest) highest = value;
	}
	return highest;
}

export function fullMoonDay(year: number, month: number): number {
	let best = 1;
	let closest = Number.POSITIVE_INFINITY;
	for (let day = 1; day <= daysInMonth(year, month); day += 1) {
		const distance = Math.abs(moonPhaseOn({ year, month, day }) - FULL_MOON_PHASE);
		if (distance < closest) {
			closest = distance;
			best = day;
		}
	}
	return best;
}

export function tideCapacityFactor(index: SegmentIndex, tide: number, floodgate: boolean): number {
	const loss = tideCapacityLoss[index] ?? 0;
	const effective = clamp(tide, 0, 1) * (floodgate ? 1 - FLOODGATE_TIDE_REDUCTION : 1);
	return 1 - loss * effective;
}

export function isRobFlood(maxTide: number, floodgate: boolean): boolean {
	return maxTide > (floodgate ? FLOODGATE_ROB_LIMIT : ROB_FLOOD_TIDE_THRESHOLD);
}
