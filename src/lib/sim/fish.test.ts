import { describe, expect, it } from 'vitest';
import {
	carryingCapacity,
	fishScore,
	nextPopulation,
	suitabilityOf,
	updateSegmentFish,
	type HabitatInput
} from './fish';

const pristine: HabitatInput = { doDawn: 7, chromium: 0, tss: 10, temperature: 25, hyacinth: 0 };
const full = { sensitive: 1, intermediate: 1, tolerant: 1 };

describe('ekologi ikan', () => {
	it('memberi kesesuaian 1 di habitat nyaman dan 0 di ambang letal', () => {
		expect(suitabilityOf('sensitive', pristine)).toBe(1);
		expect(suitabilityOf('sensitive', { ...pristine, doDawn: 3 })).toBe(0);
		expect(suitabilityOf('sensitive', { ...pristine, doDawn: 4.5 })).toBeCloseTo(0.5);
		expect(suitabilityOf('sensitive', { ...pristine, tss: 95 })).toBeCloseTo(0.5);
		expect(suitabilityOf('sensitive', { ...pristine, chromium: 0.1 })).toBe(0);
		expect(suitabilityOf('sensitive', { ...pristine, temperature: 31 })).toBe(0);
		expect(suitabilityOf('tolerant', { ...pristine, doDawn: 1 })).toBeCloseTo(0.7 / 1.2);
	});

	it('mengurangi kesesuaian dengan tutupan eceng gondok', () => {
		expect(suitabilityOf('intermediate', { ...pristine, hyacinth: 1 })).toBeCloseTo(0.5);
	});

	it('menghitung daya dukung per kelompok', () => {
		expect(carryingCapacity('sensitive', 1, 0)).toBeCloseTo(1);
		expect(carryingCapacity('sensitive', 0, 0)).toBeCloseTo(0.7);
		expect(carryingCapacity('intermediate', 0, 1)).toBeCloseTo(0.7);
		expect(carryingCapacity('tolerant', 0, 1)).toBe(1);
	});

	it('menumbuhkan populasi di habitat baik dan menghapus yang di bawah 0,01', () => {
		expect(nextPopulation('sensitive', 0.5, 1, 1, 0)).toBeCloseTo(0.5 + 0.15 * 0.5 * 0.5);
		expect(nextPopulation('sensitive', 0.005, 1, 1, 0)).toBe(0);
		expect(nextPopulation('sensitive', 0, 1, 1, 0.5)).toBeCloseTo(0.015);
		expect(nextPopulation('sensitive', 0, 0.4, 1, 0.5)).toBe(0);
		expect(nextPopulation('tolerant', 1, 1, 1, 1)).toBe(1);
	});

	it('memicu Ikan Mati Massal saat habitat runtuh', () => {
		const suitability = { sensitive: 0.1, intermediate: 1, tolerant: 1 };
		const update = updateSegmentFish(full, suitability, 1, null, null, false);
		expect(update.killed).toBe(true);
		expect(update.fish.sensitive).toBeLessThan(0.2);
		expect(update.fish.intermediate).toBeGreaterThan(0.5);
	});

	it('mencatat punah lokal lalu kembali setelah melewati 0,3', () => {
		const dying = updateSegmentFish(
			{ ...full, sensitive: 0.02 },
			{ sensitive: 0, intermediate: 1, tolerant: 1 },
			1,
			null,
			null,
			false
		);
		expect(dying.fish.sensitive).toBe(0);
		expect(dying.extinct).toEqual(['sensitive']);
		expect(dying.sensitiveLost).toBe(true);
		const recovering = updateSegmentFish(
			{ ...full, sensitive: 0.28 },
			{ sensitive: 1, intermediate: 1, tolerant: 1 },
			1,
			full,
			full,
			true
		);
		expect(recovering.returned).toBe(true);
		expect(recovering.sensitiveLost).toBe(false);
	});

	it('menimbang indikator Kehidupan Ikan dengan bobot kelompok', () => {
		expect(fishScore(full)).toBeCloseTo(100);
		expect(fishScore({ sensitive: 0, intermediate: 0, tolerant: 1 })).toBeCloseTo(15);
	});
});
