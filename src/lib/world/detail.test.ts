import { describe, expect, it } from 'vitest';
import { resolveWorldDetail, type DeviceProbe } from './detail';

const capable: DeviceProbe = { cores: 8, memory: 8, saveData: false, reducedMotion: false };

describe('Detail Dunia', () => {
	it('pilihan manual selalu menang', () => {
		expect(resolveWorldDetail('full', { ...capable, cores: 2 })).toBe('full');
		expect(resolveWorldDetail('light', capable)).toBe('light');
	});

	it('Otomatis memilih Ringan bila satu saja pemeriksaan gagal', () => {
		expect(resolveWorldDetail('auto', capable)).toBe('full');
		expect(resolveWorldDetail('auto', { ...capable, cores: 2 })).toBe('light');
		expect(resolveWorldDetail('auto', { ...capable, memory: 2 })).toBe('light');
		expect(resolveWorldDetail('auto', { ...capable, saveData: true })).toBe('light');
		expect(resolveWorldDetail('auto', { ...capable, reducedMotion: true })).toBe('light');
	});

	it('informasi perangkat yang tidak tersedia tidak dianggap gagal', () => {
		expect(resolveWorldDetail('auto', { ...capable, cores: null, memory: null })).toBe('full');
	});
});
