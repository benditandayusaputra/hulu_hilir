import {
	HOURS_PER_DAY,
	MONTHS_PER_YEAR,
	cloudCoverBySeason,
	dryMonths,
	flowFactorByMonth,
	heavyRainChanceByMonth,
	tssRainFactor,
	wetMonths
} from './constants';
import type { CalendarDate } from './types';

export type Season = 'wet' | 'transition' | 'dry';

const daysByMonth: readonly number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const LEAP_EVERY = 4;
const CENTURY = 100;
const GREGORIAN_CYCLE = 400;
const FEBRUARY = 2;
const NOON_HOUR = 12;

export function calendarDateOfMonth(start: CalendarDate, simMonth: number): CalendarDate {
	const offset = start.month - 1 + simMonth - 1;
	return {
		year: start.year + Math.floor(offset / MONTHS_PER_YEAR),
		month: (offset % MONTHS_PER_YEAR) + 1,
		day: 1
	};
}

export function calendarMonthOf(start: CalendarDate, simMonth: number): number {
	return calendarDateOfMonth(start, simMonth).month;
}

export function seasonOf(calendarMonth: number): Season {
	if (wetMonths.includes(calendarMonth)) return 'wet';
	if (dryMonths.includes(calendarMonth)) return 'dry';
	return 'transition';
}

export function flowFactorOf(calendarMonth: number): number {
	return flowFactorByMonth[calendarMonth - 1] ?? 1;
}

export function heavyRainChanceOf(calendarMonth: number): number {
	return heavyRainChanceByMonth[calendarMonth - 1] ?? 0;
}

export function tssRainFactorOf(calendarMonth: number): number {
	return tssRainFactor[seasonOf(calendarMonth)];
}

export function cloudCoverOf(calendarMonth: number): number {
	return cloudCoverBySeason[seasonOf(calendarMonth)];
}

export function isLeapYear(year: number): boolean {
	if (year % GREGORIAN_CYCLE === 0) return true;
	if (year % CENTURY === 0) return false;
	return year % LEAP_EVERY === 0;
}

export function daysInMonth(year: number, month: number): number {
	const base = daysByMonth[month - 1] ?? 30;
	return month === FEBRUARY && isLeapYear(year) ? base + 1 : base;
}

export function julianDayNumber(date: CalendarDate): number {
	const a = Math.floor((14 - date.month) / 12);
	const y = date.year + 4800 - a;
	const m = date.month + 12 * a - 3;
	return (
		date.day +
		Math.floor((153 * m + 2) / 5) +
		365 * y +
		Math.floor(y / 4) -
		Math.floor(y / 100) +
		Math.floor(y / 400) -
		32045
	);
}

export function julianDay(date: CalendarDate, hour: number): number {
	return julianDayNumber(date) + (hour - NOON_HOUR) / HOURS_PER_DAY;
}
