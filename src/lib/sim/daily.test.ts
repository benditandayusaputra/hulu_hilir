import { describe, expect, it } from 'vitest';
import {
	biomassOf,
	dailyExtremes,
	dailyProfile,
	dailyWaterTemperature,
	fullMoonDay,
	isRobFlood,
	maxTideInMonth,
	moonPhaseOn,
	moonriseHour,
	oxygenProduction,
	sunlight,
	tideAmplitude,
	tideAtHour,
	tideCapacityFactor,
	tideHeight
} from './daily';

describe('siklus harian dan langit', () => {
	it('menyalakan matahari dari pukul 6 sampai 18 dan meredupkannya dengan awan', () => {
		expect(sunlight(3, 0)).toBe(0);
		expect(sunlight(12, 0)).toBeCloseTo(1000);
		expect(sunlight(12, 1)).toBeCloseTo(250);
		expect(sunlight(21, 0)).toBe(0);
	});

	it('memuncakkan suhu air sekitar pukul 15', () => {
		expect(dailyWaterTemperature(25, 15, 0)).toBeCloseTo(26);
		expect(dailyWaterTemperature(25, 3, 0)).toBeCloseTo(24);
		expect(dailyWaterTemperature(25, 15, 1)).toBeCloseTo(25.5);
	});

	it('menghitung biomassa dari fosfat, kekeruhan, dan eceng gondok dengan batas 1,5', () => {
		expect(biomassOf(0, 0, 0)).toBe(0);
		expect(biomassOf(0.5, 0, 0)).toBeCloseTo(1);
		expect(biomassOf(0.5, 300, 0)).toBeCloseTo(0.25);
		expect(biomassOf(5, 0, 1)).toBe(1.5);
		expect(oxygenProduction(1, 12, 0)).toBeCloseTo(30.5);
	});

	it('mengayunkan DO harian dengan rata-rata tetap sama dengan DO bulanan', () => {
		const profile = dailyProfile({
			doMonthly: 6,
			doSaturation: 8,
			reaeration: 0.4,
			biomass: 1,
			cloud: 0.3,
			temperature: 28
		});
		expect(profile.dissolvedOxygen).toHaveLength(96);
		const mean = profile.dissolvedOxygen.reduce((sum, v) => sum + v, 0) / 96;
		expect(mean).toBeCloseTo(6, 0);
		expect(profile.doDawn).toBeLessThan(6);
		expect(profile.doDayMax).toBeGreaterThan(6);
		expect(profile.doDayMax).toBeLessThanOrEqual(12);
		const dawnIndex = profile.dissolvedOxygen.indexOf(profile.doDawn);
		expect(profile.hours[dawnIndex]).toBeGreaterThanOrEqual(4);
		expect(profile.hours[dawnIndex]).toBeLessThanOrEqual(8);
		expect(
			dailyExtremes({
				doMonthly: 6,
				doSaturation: 8,
				reaeration: 0.4,
				biomass: 1,
				cloud: 0.3,
				temperature: 28
			})
		).toEqual({
			doDawn: profile.doDawn,
			doDayMax: profile.doDayMax
		});
	});

	it('menahan DO harian antara nol dan 1,5 kali DO jenuh', () => {
		const profile = dailyProfile({
			doMonthly: 0.5,
			doSaturation: 7,
			reaeration: 0.3,
			biomass: 1.5,
			cloud: 0,
			temperature: 29
		});
		expect(Math.min(...profile.dissolvedOxygen)).toBeGreaterThanOrEqual(0);
		expect(Math.max(...profile.dissolvedOxygen)).toBeLessThanOrEqual(10.5);
	});

	it('menghitung fase bulan dari kalender nyata', () => {
		const nearNew = moonPhaseOn({ year: 2000, month: 1, day: 6 }, 18);
		expect(Math.min(nearNew, 1 - nearNew)).toBeCloseTo(0, 2);
		expect(moonPhaseOn({ year: 2000, month: 1, day: 21 }, 12)).toBeCloseTo(0.5, 1);
		expect(fullMoonDay(2000, 1)).toBe(21);
		expect(moonriseHour(0.5)).toBeCloseTo(18);
		expect(moonriseHour(0.9)).toBeCloseTo(3.6);
	});

	it('membuat pasang purnama lebih besar dari pasang perbani', () => {
		expect(tideAmplitude(0.5)).toBeCloseTo(0.7);
		expect(tideAmplitude(0)).toBeCloseTo(0.7);
		expect(tideAmplitude(0.25)).toBeCloseTo(0.3);
		expect(tideHeight(12, 0, 0)).toBeCloseTo(0.7);
		expect(tideHeight(12, 0, 0.3)).toBeCloseTo(1);
		expect(tideAtHour({ year: 2000, month: 1, day: 6 }, 12, 0)).toBeLessThanOrEqual(0.7);
	});

	it('tidak pernah menghasilkan Banjir Rob tanpa kenaikan muka laut', () => {
		for (let month = 1; month <= 12; month += 1) {
			expect(isRobFlood(maxTideInMonth(2026, month, 0), false)).toBe(false);
		}
		expect(isRobFlood(maxTideInMonth(2026, 1, 0.3), false)).toBe(true);
		expect(isRobFlood(maxTideInMonth(2026, 1, 0.3), true)).toBe(false);
		expect(isRobFlood(1.3, true)).toBe(true);
	});

	it('mengurangi kapasitas alur muara oleh pasang dan meredamnya dengan pintu air', () => {
		expect(tideCapacityFactor(6, 1, false)).toBeCloseTo(0.7);
		expect(tideCapacityFactor(5, 1, false)).toBeCloseTo(0.9);
		expect(tideCapacityFactor(6, 1, true)).toBeCloseTo(0.91);
		expect(tideCapacityFactor(3, 1, false)).toBe(1);
		expect(tideCapacityFactor(6, -1, false)).toBe(1);
	});
});
