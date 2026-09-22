import { describe, expect, it } from 'vitest';
import {
	calendarDateOfMonth,
	calendarMonthOf,
	cloudCoverOf,
	daysInMonth,
	flowFactorOf,
	heavyRainChanceOf,
	isLeapYear,
	julianDay,
	julianDayNumber,
	seasonOf,
	tssRainFactorOf
} from './calendar';

const start = { year: 2026, month: 1, day: 1 };

describe('kalender simulasi', () => {
	it('memetakan bulan simulasi ke bulan kalender dan tahun berikutnya', () => {
		expect(calendarMonthOf(start, 1)).toBe(1);
		expect(calendarMonthOf(start, 12)).toBe(12);
		expect(calendarDateOfMonth(start, 13)).toEqual({ year: 2027, month: 1, day: 1 });
		expect(calendarDateOfMonth({ year: 2026, month: 11, day: 1 }, 3)).toEqual({
			year: 2027,
			month: 1,
			day: 1
		});
	});

	it('mengenali musim basah, peralihan, dan kemarau', () => {
		expect(seasonOf(1)).toBe('wet');
		expect(seasonOf(4)).toBe('transition');
		expect(seasonOf(8)).toBe('dry');
		expect(tssRainFactorOf(12)).toBe(2);
		expect(tssRainFactorOf(10)).toBe(1);
		expect(tssRainFactorOf(7)).toBe(0.2);
		expect(cloudCoverOf(2)).toBe(0.7);
		expect(cloudCoverOf(6)).toBe(0.3);
	});

	it('mengambil faktor debit dan peluang hujan dari tabel', () => {
		expect(flowFactorOf(2)).toBe(1.9);
		expect(flowFactorOf(8)).toBe(0.45);
		expect(heavyRainChanceOf(2)).toBe(0.6);
		expect(heavyRainChanceOf(7)).toBe(0.03);
	});

	it('menghitung tahun kabisat dan jumlah hari', () => {
		expect(isLeapYear(2024)).toBe(true);
		expect(isLeapYear(1900)).toBe(false);
		expect(isLeapYear(2000)).toBe(true);
		expect(daysInMonth(2024, 2)).toBe(29);
		expect(daysInMonth(2026, 2)).toBe(28);
		expect(daysInMonth(2026, 4)).toBe(30);
	});

	it('menghitung Julian Day yang cocok dengan bulan baru 6 Januari 2000', () => {
		expect(julianDayNumber({ year: 2000, month: 1, day: 6 })).toBe(2451550);
		expect(julianDay({ year: 2000, month: 1, day: 6 }, 18.24)).toBeCloseTo(2451550.26, 2);
	});
});
