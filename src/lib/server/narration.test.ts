import { describe, expect, it, vi } from 'vitest';
import { samplePayload } from '$lib/ai/samplePayload';
import type { LlmCall } from './llm';
import { acceptOutput, narrate } from './narration';

const valid = JSON.stringify({
	text: 'Air di Kota berubah menjadi Cemar sedang karena 72% beban BOD datang dari permukiman padat. Ikan sensitif makin sulit bernapas dengan DO 3,1 mg/L. Coba pasang IPAL Komunal.',
	highlightSegments: [4, 4],
	glossaryTerms: ['DO', 'BOD'],
	suggestedAction: 'ipal_communal',
	factId: 'fact_do_fish'
});

function llmReturning(raw: string): LlmCall {
	return async () => raw;
}

describe('acceptOutput', () => {
	it('menerima JSON valid dan merapikan sorotan segmen', () => {
		const result = acceptOutput(valid, samplePayload());
		expect(result?.source).toBe('ai');
		expect(result?.highlightSegments).toEqual([4]);
		expect(result?.suggestedAction).toBe('ipal_communal');
		expect(result?.factId).toBe('fact_do_fish');
	});

	it('menolak angka asing, JSON rusak, dan skema salah', () => {
		const payload = samplePayload();
		expect(acceptOutput(JSON.stringify({ text: 'BOD naik ke 999,9 mg/L.' }), payload)).toBeNull();
		expect(acceptOutput('bukan json', payload)).toBeNull();
		expect(acceptOutput(JSON.stringify({ teks: 'salah kunci' }), payload)).toBeNull();
	});

	it('membuka pagar kode, mengganti em dash, dan menolak saran di luar daftar', () => {
		const fenced =
			'```json\n' +
			JSON.stringify({
				text: 'Air berubah — ikan tertekan.',
				suggestedAction: 'floodgate',
				factId: 'fact_tidak_ada'
			}) +
			'\n```';
		const result = acceptOutput(fenced, samplePayload());
		expect(result?.text).toBe('Air berubah, ikan tertekan.');
		expect(result?.suggestedAction).toBeNull();
		expect(result?.factId).toBeNull();
	});

	it('memotong teks yang melewati 90 kata di batas kalimat', () => {
		const long = `${'Air berubah lagi. '.repeat(40)}`;
		const result = acceptOutput(JSON.stringify({ text: long }), samplePayload());
		expect(result?.text.split(' ').length).toBeLessThanOrEqual(90);
		expect(result?.text.endsWith('.')).toBe(true);
	});
});

describe('narrate', () => {
	it('memakai template bila LLM tidak dikonfigurasi', async () => {
		const result = await narrate(samplePayload(), null);
		expect(result.source).toBe('template');
	});

	it('mengembalikan narasi AI dan menyimpannya di cache', async () => {
		const llm = vi.fn(llmReturning(valid));
		const cache = new Map();
		const first = await narrate(samplePayload(), llm, { cache });
		const second = await narrate(samplePayload(), llm, { cache });
		expect(first.source).toBe('ai');
		expect(second).toEqual(first);
		expect(llm).toHaveBeenCalledTimes(1);
	});

	it('beralih ke template saat LLM gagal, melewati batas waktu, atau menjawab angka asing', async () => {
		const failing: LlmCall = async () => {
			throw new Error('status 503');
		};
		expect((await narrate(samplePayload(), failing)).source).toBe('template');
		const slow: LlmCall = (_system, _user, signal) =>
			new Promise((_resolve, reject) => {
				signal.addEventListener('abort', () => reject(new Error('aborted')));
			});
		expect((await narrate(samplePayload(), slow, { timeoutMs: 20 })).source).toBe('template');
		const foreign = llmReturning(JSON.stringify({ text: 'Coliform mencapai 12.345 MPN.' }));
		expect((await narrate(samplePayload(), foreign)).source).toBe('template');
	});
});
