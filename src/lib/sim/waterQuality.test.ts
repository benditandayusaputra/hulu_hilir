import { describe, expect, it } from 'vitest';
import { backgroundConcentration } from './constants';
import { zeroLoad } from './loads';
import type { TileState } from './types';
import {
	decayRateOf,
	doSaturationAt,
	mixConcentration,
	reaerationRate,
	routeLoads,
	routeOxygen,
	segmentTemperature,
	shadeOf,
	streeterPhelpsDeficit,
	temperatureCorrected,
	type SegmentPhysics
} from './waterQuality';

function physics(overrides: Partial<SegmentPhysics> = {}): SegmentPhysics {
	return {
		index: 1,
		flow: 1.5,
		travelTime: 0.1,
		temperature: 20,
		hyacinth: 0,
		sediment: 0,
		tssMultiplier: 1,
		coliformMultiplier: 1,
		...overrides
	};
}

describe('fisika mutu air', () => {
	it('menghitung DO jenuh sekitar 9,0 mg/L pada 20 derajat', () => {
		expect(doSaturationAt(20)).toBeCloseTo(9.02, 1);
		expect(doSaturationAt(29)).toBeLessThan(doSaturationAt(20));
	});

	it('mengoreksi laju terhadap suhu dengan theta', () => {
		expect(temperatureCorrected({ rate: 0.23, theta: 1.047 }, 20)).toBeCloseTo(0.23);
		expect(temperatureCorrected({ rate: 0.23, theta: 1.047 }, 30)).toBeCloseTo(0.23 * 1.047 ** 10);
	});

	it('menghitung reaerasi O Connor Dobbins dan mengurangi tutupan eceng gondok', () => {
		expect(reaerationRate(1, 20, 0)).toBeCloseTo((3.93 * 1) / 0.5 ** 1.5);
		expect(reaerationRate(1, 20, 1)).toBeCloseTo(0.4 * reaerationRate(1, 20, 0));
	});

	it('memakai laju pengendapan TSS dari kecepatan endap dibagi kedalaman', () => {
		expect(decayRateOf('tss', physics({ index: 6 }))).toBeCloseTo(1 / 3);
		expect(decayRateOf('chromium', physics())).toBeCloseTo(0.02);
		expect(decayRateOf('nitrate', physics())).toBeCloseTo(0.05);
		expect(decayRateOf('fecalColiform', physics())).toBeCloseTo(0.8);
	});

	it('mencampur konsentrasi hulu, debit tambahan, dan beban lokal', () => {
		expect(mixConcentration('bod', 0, 0, 1, 86.4, 1)).toBeCloseTo(2);
		expect(mixConcentration('bod', 1, 3, 2, 0, 1)).toBeCloseTo(2);
		expect(mixConcentration('fecalColiform', 0, 0, 1, 8.64e8, 0)).toBeCloseTo(1);
	});

	it('menyalurkan beban dari hulu ke hilir dengan pengenceran dan peluruhan', () => {
		const loads = [{ ...zeroLoad, bod: 86.4 * 1.5 }, { ...zeroLoad }];
		const chain = [physics(), physics({ index: 2, flow: 2.5, travelTime: 0 })];
		const routed = routeLoads(loads, chain);
		expect(routed.mixed[0]?.bod).toBeCloseTo(backgroundConcentration.bod + 1);
		expect(routed.out[0]?.bod).toBeLessThan(routed.mixed[0]?.bod ?? 0);
		const expected = ((routed.out[0]?.bod ?? 0) * 1.5 + 1 * backgroundConcentration.bod) / 2.5;
		expect(routed.mixed[1]?.bod).toBeCloseTo(expected);
		expect(routed.out[1]?.bod).toBeCloseTo(expected);
	});

	it('mengalikan TSS dan fecal coliform saat banjir', () => {
		const routed = routeLoads(
			[{ ...zeroLoad }],
			[physics({ tssMultiplier: 1.5, coliformMultiplier: 2 })]
		);
		expect(routed.mixed[0]?.tss).toBeCloseTo(backgroundConcentration.tss * 1.5);
		expect(routed.mixed[0]?.fecalColiform).toBeCloseTo(backgroundConcentration.fecalColiform * 2);
	});

	it('memakai bentuk limit Streeter-Phelps saat k1 dan k2 hampir sama', () => {
		const limit = streeterPhelpsDeficit(0.5, 0.5, 10, 0, 0, 1);
		const near = streeterPhelpsDeficit(0.5, 0.5005, 10, 0, 0, 1);
		expect(limit).toBeCloseTo(0.5 * 10 * Math.exp(-0.5));
		expect(near).toBeCloseTo(limit, 2);
		expect(streeterPhelpsDeficit(0.2, 1, 0, 2, 0, 1)).toBeCloseTo(2 * Math.exp(-1));
		expect(streeterPhelpsDeficit(0.2, 1, 0, 0, 0.5, 2)).toBeCloseTo(1);
	});

	it('menurunkan DO di hilir beban BOD dan tidak pernah di bawah nol', () => {
		const chain = [physics({ travelTime: 0.5 }), physics({ index: 2, flow: 2.5, travelTime: 0.5 })];
		const clean = routeOxygen([1, 1], chain);
		const dirty = routeOxygen([200, 100], chain);
		expect(clean[0]?.dissolved).toBeLessThanOrEqual(clean[0]?.saturation ?? 0);
		expect(dirty[1]?.dissolved).toBeLessThan(clean[1]?.dissolved ?? 0);
		expect(dirty[1]?.dissolved).toBeGreaterThanOrEqual(0);
	});

	it('menghitung naungan dari petak dekat sungai dan sabuk hijau', () => {
		const near = (landUse: TileState['landUse'], maturity: number): TileState => ({
			id: 'S1-L1',
			segment: 1,
			side: 'L',
			position: 1,
			landUse,
			forestMaturity: maturity,
			interventions: []
		});
		const far: TileState = { ...near('forest', 1), position: 2 };
		expect(shadeOf([near('forest', 1), near('open_land', 0), far], 0)).toBeCloseTo(0.5);
		expect(shadeOf([near('forest', 0.5), near('forest', 0.5)], 1)).toBe(1);
		expect(shadeOf([], 0)).toBe(0);
	});

	it('menaikkan suhu saat naungan hilang dan saat Kemarau Panjang', () => {
		expect(segmentTemperature(1, 1, false)).toBe(23);
		expect(segmentTemperature(1, 0, true)).toBe(25.5);
	});
});
