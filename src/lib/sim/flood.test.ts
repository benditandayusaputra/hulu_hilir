import { describe, expect, it } from 'vitest';
import {
	effectiveCapacity,
	floodImpact,
	floodRiskScore,
	floodStatusOf,
	localRunoffPeaks,
	peakFlows,
	type TileRunoff
} from './flood';
import type { TileState } from './types';

const forestTiles: TileRunoff[] = [1, 2, 3, 4, 5, 6].flatMap((segment) =>
	[0, 1, 2, 3].map(() => ({ segment: segment as 1 | 2 | 3 | 4 | 5 | 6, runoff: 0.15 }))
);

describe('banjir', () => {
	it('menghitung limpasan lokal dengan metode rasional', () => {
		const peaks = localRunoffPeaks([{ segment: 1, runoff: 0.5 }], 40);
		expect(peaks[0]).toBeCloseTo(0.278 * 0.5 * 40 * 3);
		expect(peaks[1]).toBe(0);
	});

	it('meredam aliran dari hulu 0,85 per segmen dan mengurangi kolam retensi', () => {
		const flows = [1, 1, 1, 1, 1, 1];
		const peaks = peakFlows(flows, [{ segment: 1, runoff: 0.5 }], 40, new Set([2]));
		const local = 0.278 * 0.5 * 40 * 3;
		expect(peaks[0]).toBeCloseTo(1 + local);
		expect(peaks[1]).toBeCloseTo(Math.max(0, 1 + 0.85 * local - 25));
		expect(peaks[2]).toBeCloseTo(1 + 0.85 ** 2 * local);
	});

	it('mengurangi kapasitas efektif oleh sedimen, sampah, eceng gondok, dan pasang', () => {
		expect(effectiveCapacity(1, 0, 0, 0, 1)).toBe(45);
		expect(effectiveCapacity(1, 1, 100, 1, 0.5)).toBeCloseTo(45 * 0.65 * 0.75 * 0.8 * 0.5);
	});

	it('memetakan rasio ke empat status banjir', () => {
		expect(floodStatusOf(0.5)).toBe('safe');
		expect(floodStatusOf(0.8)).toBe('alert');
		expect(floodStatusOf(1.0)).toBe('alert');
		expect(floodStatusOf(1.2)).toBe('minor');
		expect(floodStatusOf(1.5)).toBe('major');
	});

	it('menghitung Risiko Banjir dari rasio terburuk', () => {
		expect(floodRiskScore([0.3, 0.5])).toBe(0);
		expect(floodRiskScore([0.3, 1.0])).toBeCloseTo(50);
		expect(floodRiskScore([2, 0.1])).toBe(100);
	});

	it('menjaga sungai alami tetap aman saat hujan lebat', () => {
		const flows = [2.85, 4.75, 7.6, 10.45, 14.25, 16.15];
		const peaks = peakFlows(flows, forestTiles, 40, new Set());
		peaks.forEach((peak, i) => {
			const index = (i + 1) as 1 | 2 | 3 | 4 | 5 | 6;
			expect(peak / effectiveCapacity(index, 0.1, 0, 0, 1)).toBeLessThan(0.8);
		});
	});

	it('menghitung warga terdampak, gagal panen, dan kerugian', () => {
		const tiles: TileState[] = [
			{
				id: 'S4-L1',
				segment: 4,
				side: 'L',
				position: 1,
				landUse: 'settlement',
				forestMaturity: 1,
				interventions: []
			},
			{
				id: 'S4-L2',
				segment: 4,
				side: 'L',
				position: 2,
				landUse: 'paddy',
				forestMaturity: 1,
				interventions: []
			},
			{
				id: 'S4-R1',
				segment: 4,
				side: 'R',
				position: 1,
				landUse: 'factory',
				forestMaturity: 1,
				interventions: []
			}
		];
		const impact = floodImpact(tiles, 1.25);
		expect(impact.affectedResidents).toBe(2500);
		expect(impact.failedPaddies).toBe(1);
		expect(impact.losses).toBeCloseTo(0.5 * 1.25 * 2);
		expect(floodImpact(tiles, 2).affectedResidents).toBe(5000);
	});
});
