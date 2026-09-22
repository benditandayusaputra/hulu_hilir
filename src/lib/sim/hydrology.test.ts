import { describe, expect, it } from 'vitest';
import { segmentFlows, travelTimeDays } from './hydrology';

describe('debit segmen', () => {
	it('menjumlahkan debit dasar dari hulu ke muara dan mengalikan faktor musim', () => {
		const flows = segmentFlows(1, false);
		expect(flows).toEqual([1.5, 2.5, 4, 5.5, 7.5, 8.5]);
		expect(segmentFlows(0.45, false)[0]).toBeCloseTo(0.675);
	});

	it('mengurangi debit saat Kemarau Panjang', () => {
		expect(segmentFlows(1, true)[5]).toBeCloseTo(8.5 * 0.6);
	});

	it('menghitung waktu tempuh dalam hari dari panjang dan kecepatan', () => {
		expect(travelTimeDays(1)).toBeCloseTo(8000 / 86400);
		expect(travelTimeDays(6)).toBeCloseTo(8000 / (86400 * 0.25));
	});
});
