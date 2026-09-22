import { describe, expect, it, vi } from 'vitest';
import { fetchNarration } from './client';
import { samplePayload } from './samplePayload';

vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_AI_MODE: 'server' } }));

function respond(body: unknown, status = 200): typeof fetch {
	return async () => new Response(JSON.stringify(body), { status });
}

const aiResult = {
	text: 'Air di Kota berubah karena 72% beban BOD dari permukiman padat.',
	source: 'ai',
	highlightSegments: [4],
	suggestedAction: 'ipal_communal',
	factId: null
};

describe('fetchNarration', () => {
	it('mengembalikan narasi AI yang valid dari server', async () => {
		const result = await fetchNarration(samplePayload(), respond(aiResult));
		expect(result.source).toBe('ai');
		expect(result.text).toBe(aiResult.text);
	});

	it('beralih ke template saat server gagal, bentuk salah, atau angka asing', async () => {
		expect((await fetchNarration(samplePayload(), respond({}, 500))).source).toBe('template');
		expect((await fetchNarration(samplePayload(), respond({ nope: true }))).source).toBe(
			'template'
		);
		expect(
			(await fetchNarration(samplePayload(), respond({ ...aiResult, text: 'BOD 999,9 mg/L' })))
				.source
		).toBe('template');
		const failing: typeof fetch = async () => {
			throw new Error('offline');
		};
		expect((await fetchNarration(samplePayload(), failing)).source).toBe('template');
	});
});
