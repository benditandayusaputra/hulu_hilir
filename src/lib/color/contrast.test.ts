import { describe, expect, it } from 'vitest';
import { contrastRatio, parseRgb } from './contrast';

describe('contrastRatio', () => {
	it('memberi 21 untuk hitam di atas putih, apa pun urutannya', () => {
		expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
		expect(contrastRatio([255, 255, 255], [0, 0, 0])).toBeCloseTo(21, 5);
	});

	it('cocok dengan nilai acuan krem di atas kayu HUD', () => {
		expect(contrastRatio([255, 244, 220], [138, 90, 47])).toBeCloseTo(5.36, 2);
	});
});

describe('parseRgb', () => {
	it('membaca rgb dan rgba hasil getComputedStyle', () => {
		expect(parseRgb('rgb(31, 42, 46)')).toEqual([31, 42, 46]);
		expect(parseRgb('rgba(255, 244, 220, 0.5)')).toEqual([255, 244, 220]);
	});

	it('menolak format lain', () => {
		expect(parseRgb('oklab(0.5 0 0)')).toBeNull();
	});
});
