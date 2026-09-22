import { describe, expect, it } from 'vitest';
import {
	allowedNumbers,
	extractNumbers,
	extractWordNumbers,
	foreignNumbers,
	isAllowedNumber
} from './numbers';
import { samplePayload } from './samplePayload';

describe('extractNumbers', () => {
	it('membaca format Indonesia: koma desimal, titik ribuan, dan persen', () => {
		expect(extractNumbers('IP 6,4 dan coliform 9.200 serta 72% beban')).toEqual([6.4, 9200, 72]);
	});

	it('membaca desimal gaya Inggris dan ribuan berkoma desimal', () => {
		expect(extractNumbers('DO 3.1 mg/L, TSS 1.250,5 mg/L')).toEqual([3.1, 1250.5]);
	});

	it('membaca angka dalam kata', () => {
		expect(
			extractWordNumbers('tiga bulan lalu dua belas segmen dan dua puluh lima persen')
		).toEqual([3, 12, 25]);
		expect(extractWordNumbers('dua ratus lima puluh warga, seribu liter')).toEqual([250, 1000]);
	});
});

describe('allowedNumbers dan foreignNumbers', () => {
	const payload = samplePayload();

	it('mengizinkan angka payload, porsi dalam persen, dan bilangan 1 sampai 12', () => {
		const allowed = allowedNumbers(payload);
		expect(isAllowedNumber(5.8, allowed)).toBe(true);
		expect(isAllowedNumber(72, allowed)).toBe(true);
		expect(isAllowedNumber(9200, allowed)).toBe(true);
		expect(isAllowedNumber(7, allowed)).toBe(true);
		expect(isAllowedNumber(13, allowed)).toBe(false);
		expect(isAllowedNumber(999.9, allowed)).toBe(false);
	});

	it('menerima teks yang hanya memakai angka payload', () => {
		expect(
			foreignNumbers(
				'IP naik ke 5,8 karena 72% beban BOD dari permukiman, coliform 9.200.',
				payload
			)
		).toEqual([]);
	});

	it('menolak satu angka asing saja', () => {
		expect(foreignNumbers('BOD melonjak menjadi 999,9 mg/L.', payload)).toEqual([999.9]);
		expect(foreignNumbers('baku mutu 1.000 MPN dilewati', payload)).toEqual([1000]);
	});

	it('menoleransi pembulatan satu desimal dan pembulatan persen', () => {
		const primary = payload.segments[0];
		if (primary === undefined) throw new Error('sample payload has no segment');
		const raw = samplePayload({
			segments: [{ ...primary, ip: 5.83 }],
			causes: [{ type: 'load', source: 'Sawah', segment: 4, shareOfBod: 0.7234 }]
		});
		expect(foreignNumbers('IP 5,8 dan porsi 72%', raw)).toEqual([]);
		expect(foreignNumbers('IP 5,9', raw)).toEqual([5.9]);
		expect(foreignNumbers('porsi 72,3%', raw)).toEqual([]);
		expect(foreignNumbers('porsi 73%', raw)).toEqual([73]);
	});
});
