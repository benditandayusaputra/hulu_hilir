import { describe, expect, it } from 'vitest';
import {
	cashEfficiencyOf,
	dawnOxygenAtEnd,
	evaluateMission,
	fishPresentAtEnd,
	indicatorAtEnd,
	litterAtEnd,
	monthsOfYear,
	noAffectedResidentsInYear,
	noEventInYear,
	parameterAtEnd,
	parameterMeetsStandard,
	reducedByHalfVsFirstYear,
	segmentsStatusAtLeast,
	segmentsWithFishAtEnd,
	segmentsWithStatusAtEnd,
	starsOf,
	target
} from './evaluate';
import { finalState, replay } from './replay';
import { defineScenario, layout, scenarios } from './scenarios';
import type { MissionDefinition } from './types';

const natural = scenarios['alami'] ?? defineScenario({ id: 'x', tiles: layout('forest') });
const history = replay(natural, 5, [], 24);
const final = finalState(history);

describe('predikat target misi', () => {
	it('membaca indikator, status, parameter, dan stok di akhir', () => {
		expect(indicatorAtEnd('floodRisk', 'max', 40)(history)).toBe(true);
		expect(indicatorAtEnd('fish', 'min', 100)(history)).toBe(false);
		expect(segmentsStatusAtLeast([1, 2, 3], 'good')(history)).toBe(true);
		expect(segmentsWithStatusAtEnd('good', 6)(history)).toBe(true);
		expect(parameterAtEnd(3, 'bod', 'max', 3)(history)).toBe(true);
		expect(parameterMeetsStandard(3, 'tss')(history)).toBe(true);
		expect(parameterMeetsStandard(3, 'do')(history)).toBe(true);
		expect(litterAtEnd(6, 30)(history)).toBe(true);
		expect(dawnOxygenAtEnd(5, 3)(history)).toBe(true);
		expect(fishPresentAtEnd(3, 'sensitive')(history)).toBe(true);
		expect(fishPresentAtEnd(6, 'sensitive', 0.9)(history)).toBe(false);
		expect(segmentsWithFishAtEnd('sensitive', 2)(history)).toBe(true);
	});

	it('memeriksa kejadian dan warga terdampak per tahun serta penurunan separuh', () => {
		expect(monthsOfYear(history, 2)).toHaveLength(12);
		expect(monthsOfYear(history, 2)[0]?.month).toBe(13);
		expect(noEventInYear('flood', 2)(history)).toBe(true);
		expect(noAffectedResidentsInYear(2)(history)).toBe(true);
		expect(reducedByHalfVsFirstYear('litterToSea', 2)(history)).toBe(true);
		expect(reducedByHalfVsFirstYear('affectedResidents', 2)(history)).toBe(true);
		const city = replay(scenarios['kota-padat'] ?? natural, 5, [], 24);
		expect(reducedByHalfVsFirstYear('litterToSea', 2)(city)).toBe(false);
	});

	it('menghitung bintang bertingkat kumulatif', () => {
		expect(starsOf([])).toBe(0);
		expect(starsOf([{ id: 'a', star: 1, met: true }])).toBe(1);
		expect(
			starsOf([
				{ id: 'a', star: 1, met: true },
				{ id: 'b', star: 2, met: false },
				{ id: 'c', star: 3, met: true }
			])
		).toBe(1);
		expect(
			starsOf([
				{ id: 'a', star: 1, met: true },
				{ id: 'b', star: 2, met: true },
				{ id: 'c', star: 3, met: true }
			])
		).toBe(3);
	});

	it('menghitung efisiensi kas dan skor 0 sampai 100', () => {
		expect(cashEfficiencyOf(final)).toBe(1);
		expect(cashEfficiencyOf({ ...final, cash: 5, cashReceived: 10 })).toBeCloseTo(0.5);
		expect(cashEfficiencyOf({ ...final, cash: -1, cashReceived: 10 })).toBe(0);
		const mission: MissionDefinition = {
			id: 'uji',
			months: 24,
			targets: [
				target('aman', 1, indicatorAtEnd('floodRisk', 'max', 40)),
				target('baik', 2, segmentsWithStatusAtEnd('good', 6)),
				target('mustahil', 3, indicatorAtEnd('fish', 'min', 100))
			]
		};
		const result = evaluateMission(history, mission);
		expect(result.stars).toBe(2);
		expect(result.targets.map((item) => item.met)).toEqual([true, true, false]);
		expect(result.score).toBeGreaterThan(60);
		expect(result.score).toBeLessThanOrEqual(100);
		expect(Number.isInteger(result.score)).toBe(true);
		expect(result.cashEfficiency).toBe(1);
	});
});
