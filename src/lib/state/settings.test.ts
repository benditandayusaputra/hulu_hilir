import { describe, expect, it } from 'vitest';
import {
	defaultSettings,
	parseSettings,
	resolveReducedMotion,
	resolveTheme,
	settingsSchemaVersion
} from './settings.svelte';

describe('parseSettings', () => {
	it('mengembalikan nilai bawaan untuk data yang bukan objek', () => {
		expect(parseSettings('rusak')).toEqual(defaultSettings);
	});

	it('mengembalikan nilai bawaan bila versi skema tidak cocok', () => {
		expect(parseSettings({ schemaVersion: 99, theme: 'dark' })).toEqual(defaultSettings);
	});

	it('menerima nilai yang dikenal dan menolak nilai asing', () => {
		const parsed = parseSettings({
			schemaVersion: settingsSchemaVersion,
			theme: 'dark',
			textSize: 'raksasa',
			motion: 'reduced',
			scientificMode: 'ya'
		});
		expect(parsed.theme).toBe('dark');
		expect(parsed.textSize).toBe(defaultSettings.textSize);
		expect(parsed.motion).toBe('reduced');
		expect(parsed.scientificMode).toBe(defaultSettings.scientificMode);
	});
});

describe('resolveReducedMotion', () => {
	it('mendahulukan pilihan pengguna di atas preferensi sistem', () => {
		expect(resolveReducedMotion('full', true)).toBe(false);
		expect(resolveReducedMotion('reduced', false)).toBe(true);
	});

	it('mengikuti sistem saat pilihan pengguna Ikuti sistem', () => {
		expect(resolveReducedMotion('system', true)).toBe(true);
		expect(resolveReducedMotion('system', false)).toBe(false);
	});
});

describe('resolveTheme', () => {
	it('mengikuti sistem hanya saat pilihan pengguna Ikuti sistem', () => {
		expect(resolveTheme('system', true)).toBe('dark');
		expect(resolveTheme('system', false)).toBe('light');
		expect(resolveTheme('light', true)).toBe('light');
		expect(resolveTheme('dark', false)).toBe('dark');
	});
});
