import { describe, expect, it } from 'vitest';
import {
	lengthWeightedAverage,
	pollutionIndexOf,
	ratioOf,
	scaledRatio,
	statusOf,
	statusRank,
	waterQualityScore,
	worstSegment
} from './pollutionIndex';
import type { Concentrations } from './types';

const clean: Concentrations = {
	do: 8,
	bod: 1,
	tss: 10,
	nitrate: 0.5,
	phosphate: 0.03,
	fecalColiform: 50,
	chromium: 0
};

describe('Indeks Pencemaran', () => {
	it('menghitung rasio DO terbalik dan membulatkan rasio negatif ke nol', () => {
		expect(ratioOf('do', 6, 9)).toBeCloseTo(0.6);
		expect(ratioOf('do', 9.5, 9)).toBe(0);
		expect(ratioOf('do', 2, 3)).toBe(0);
		expect(ratioOf('bod', 6, 9)).toBe(2);
	});

	it('mengganti rasio di atas satu dengan 1 + 5 log10', () => {
		expect(scaledRatio(0.5)).toBe(0.5);
		expect(scaledRatio(1)).toBe(1);
		expect(scaledRatio(10)).toBeCloseTo(6);
	});

	it('menghasilkan IP di bawah satu untuk air bersih dan naik saat tercemar', () => {
		const good = pollutionIndexOf(clean, 9);
		expect(good).toBeLessThan(1);
		const dirty = pollutionIndexOf({ ...clean, bod: 30, fecalColiform: 100000 }, 9);
		expect(dirty).toBeGreaterThan(5);
	});

	it('memetakan IP ke empat status resmi', () => {
		expect(statusOf(0.5)).toBe('good');
		expect(statusOf(1)).toBe('good');
		expect(statusOf(1.01)).toBe('light');
		expect(statusOf(5)).toBe('light');
		expect(statusOf(7)).toBe('moderate');
		expect(statusOf(10.5)).toBe('heavy');
		expect(statusRank('heavy')).toBeGreaterThan(statusRank('light'));
	});

	it('memetakan indikator Kualitas Air linear sepotong-sepotong', () => {
		expect(waterQualityScore(0)).toBe(100);
		expect(waterQualityScore(1)).toBe(75);
		expect(waterQualityScore(3)).toBe(60);
		expect(waterQualityScore(5)).toBe(45);
		expect(waterQualityScore(10)).toBe(20);
		expect(waterQualityScore(15)).toBe(10);
		expect(waterQualityScore(20)).toBe(0);
		expect(waterQualityScore(40)).toBe(0);
	});

	it('menimbang rata-rata sungai dengan panjang segmen dan menunjuk segmen terburuk', () => {
		expect(lengthWeightedAverage([1, 1, 1, 1, 1, 1])).toBeCloseTo(1);
		expect(lengthWeightedAverage([0, 0, 62, 0, 0, 0])).toBeCloseTo(12);
		expect(worstSegment([0.5, 2, 1, 3, 0.2, 0.1])).toBe(4);
	});
});
