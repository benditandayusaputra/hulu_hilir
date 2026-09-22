import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Announcer, politeIntervalMs } from './announcer.svelte';

describe('Announcer', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('mengirim pesan polite pertama seketika', () => {
		const announcer = new Announcer();
		announcer.announce('Bulan Juli tahun 2.');
		expect(announcer.polite).toBe('Bulan Juli tahun 2.');
	});

	it('menggabungkan pesan yang menumpuk dalam satu jeda', () => {
		const announcer = new Announcer();
		announcer.announce('Pesan satu.');
		announcer.announce('Pesan dua.');
		announcer.announce('Pesan tiga.');
		expect(announcer.polite).toBe('Pesan satu.');
		vi.advanceTimersByTime(politeIntervalMs);
		expect(announcer.polite).toBe('Pesan dua. Pesan tiga.');
	});

	it('mengirim pesan assertive tanpa menunggu antrean polite', () => {
		const announcer = new Announcer();
		announcer.announce('Pesan polite.');
		announcer.announce('Kas tidak cukup untuk Kolam Retensi.', 'assertive');
		expect(announcer.assertive).toBe('Kas tidak cukup untuk Kolam Retensi.');
	});

	it('mengabaikan pesan kosong', () => {
		const announcer = new Announcer();
		announcer.announce('   ');
		expect(announcer.polite).toBe('');
	});
});
