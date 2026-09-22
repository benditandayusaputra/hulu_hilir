import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { samplePayload } from '$lib/ai/samplePayload';

const client = vi.hoisted(() => ({ available: false }));

vi.mock('$lib/ai/client', () => ({
	aiAvailable: () => client.available,
	fetchNarration: vi.fn()
}));

import type { NarrationPayload, NarrationResult } from '$lib/ai/schemas';
import { announcer } from './announcer.svelte';
import { HISTORY_LIMIT, MIN_GAP_MS, Narrator } from './narrator.svelte';
import { settings } from './settings.svelte';

function resultFor(payload: NarrationPayload): NarrationResult {
	return {
		text: `Narasi bulan ${payload.month}.`,
		source: 'template',
		highlightSegments: [],
		suggestedAction: null,
		factId: null
	};
}

describe('Narrator', () => {
	let now = 0;

	beforeEach(() => {
		vi.useFakeTimers();
		now = 0;
		client.available = false;
		settings.narrationFrequency = 'normal';
		announcer.clear();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function make() {
		const request = vi.fn(async (payload: NarrationPayload) => resultFor(payload));
		return { request, narrator: new Narrator(request, () => now) };
	}

	it('menjalankan narasi pertama seketika dan mengumumkan teks utuh', async () => {
		const { narrator } = make();
		narrator.consider(samplePayload({ month: 1 }), 'medium', 1);
		await vi.advanceTimersByTimeAsync(0);
		expect(narrator.entries[0]?.text).toBe('Narasi bulan 1.');
		expect(narrator.busy).toBe(false);
		expect(announcer.polite).toBe('Narasi bulan 1.');
	});

	it('menandai sibuk dan mengumumkan pemandu sedang menulis saat AI aktif', async () => {
		client.available = true;
		let finish: (value: NarrationResult) => void = () => {};
		const request = vi.fn(
			(payload: NarrationPayload) =>
				new Promise<NarrationResult>((resolve) => {
					finish = (value) => resolve({ ...value, text: `AI bulan ${payload.month}.` });
				})
		);
		const narrator = new Narrator(request, () => now);
		narrator.consider(samplePayload({ month: 5 }), 'medium', 1);
		await vi.advanceTimersByTimeAsync(0);
		expect(narrator.busy).toBe(true);
		expect(announcer.polite).toBe('Pemandu sedang menulis');
		finish(resultFor(samplePayload({ month: 5 })));
		await vi.advanceTimersByTimeAsync(0);
		expect(narrator.busy).toBe(false);
		expect(narrator.entries[0]?.text).toBe('AI bulan 5.');
	});

	it('menunggu jeda 4 detik dan mengganti pemicu yang belum terkirim', async () => {
		const { request, narrator } = make();
		narrator.consider(samplePayload({ month: 1 }), 'medium', 1);
		await vi.advanceTimersByTimeAsync(0);
		narrator.consider(samplePayload({ month: 2 }), 'medium', 1);
		narrator.consider(samplePayload({ month: 3 }), 'medium', 1);
		now += MIN_GAP_MS - 1;
		await vi.advanceTimersByTimeAsync(MIN_GAP_MS - 1);
		expect(narrator.entries).toHaveLength(1);
		now += 1;
		await vi.advanceTimersByTimeAsync(1);
		expect(narrator.entries).toHaveLength(2);
		expect(narrator.entries[0]?.month).toBe(3);
		expect(request).toHaveBeenCalledTimes(2);
	});

	it('menyaring pemicu sesuai kecepatan dan frekuensi narasi', async () => {
		const { narrator } = make();
		narrator.consider(samplePayload({ month: 1 }), 'medium', 4);
		await vi.advanceTimersByTimeAsync(0);
		expect(narrator.entries).toHaveLength(0);
		narrator.consider(samplePayload({ month: 2, trigger: 'flood' }), 'high', 4);
		await vi.advanceTimersByTimeAsync(0);
		expect(narrator.entries).toHaveLength(1);
		settings.narrationFrequency = 'important';
		now += MIN_GAP_MS;
		narrator.consider(samplePayload({ month: 3 }), 'medium', 1);
		await vi.advanceTimersByTimeAsync(MIN_GAP_MS);
		expect(narrator.entries).toHaveLength(1);
		settings.narrationFrequency = 'off';
		narrator.consider(samplePayload({ month: 4, trigger: 'flood' }), 'high', 1);
		await vi.advanceTimersByTimeAsync(MIN_GAP_MS);
		expect(narrator.entries).toHaveLength(1);
	});

	it('menyimpan maksimal sepuluh narasi terakhir dan bisa dikosongkan', async () => {
		const { narrator } = make();
		for (let month = 1; month <= HISTORY_LIMIT + 3; month += 1) {
			narrator.consider(samplePayload({ month }), 'medium', 1);
			now += MIN_GAP_MS;
			await vi.advanceTimersByTimeAsync(MIN_GAP_MS);
		}
		expect(narrator.entries).toHaveLength(HISTORY_LIMIT);
		expect(narrator.entries[0]?.month).toBe(HISTORY_LIMIT + 3);
		narrator.clear();
		expect(narrator.entries).toHaveLength(0);
	});
});
