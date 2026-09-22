import { describe, expect, it } from 'vitest';
import {
	formatBillions,
	formatCompact,
	formatNumber,
	formatPercent,
	formatScore,
	formatSignedScore
} from './number';

describe('formatNumber', () => {
	it('memakai koma desimal dan titik ribuan', () => {
		expect(formatNumber(6.24, 1)).toBe('6,2');
		expect(formatNumber(9200)).toBe('9.200');
	});
});

describe('formatBillions', () => {
	it('menulis rupiah miliar tanpa desimal berlebih', () => {
		expect(formatBillions(8)).toBe('Rp 8 miliar');
		expect(formatBillions(0.5)).toBe('Rp 0,5 miliar');
		expect(formatBillions(0.15)).toBe('Rp 0,15 miliar');
	});
});

describe('formatCompact', () => {
	it('meringkas angka besar dengan singkatan Indonesia', () => {
		expect(formatCompact(9200)).toBe('9.200');
		expect(formatCompact(12000)).toBe('12\u00a0rb');
		expect(formatCompact(1250000)).toBe('1,3\u00a0jt');
	});
});

describe('formatPercent dan skor', () => {
	it('membulatkan ke bilangan bulat', () => {
		expect(formatPercent(0.624)).toBe('62%');
		expect(formatScore(57.6)).toBe('58');
		expect(formatSignedScore(3.6)).toBe('+4');
		expect(formatSignedScore(-3.6)).toBe('-4');
		expect(formatSignedScore(0.2)).toBe('0');
	});
});
