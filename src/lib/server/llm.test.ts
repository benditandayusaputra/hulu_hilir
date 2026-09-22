import { describe, expect, it, vi } from 'vitest';
import { createChatCompletion, llmConfigFrom } from './llm';

describe('llmConfigFrom', () => {
	it('membutuhkan ketiga variabel dan membuang garis miring akhir', () => {
		expect(llmConfigFrom({ AI_LLM_BASE_URL: 'https://x/', AI_LLM_API_KEY: 'k' })).toBeNull();
		expect(
			llmConfigFrom({ AI_LLM_BASE_URL: 'https://x/v1/', AI_LLM_API_KEY: 'k', AI_LLM_MODEL: 'm' })
		).toEqual({ baseUrl: 'https://x/v1', apiKey: 'k', model: 'm' });
	});
});

describe('createChatCompletion', () => {
	it('mengirim permintaan chat completions dan mengembalikan isi pesan', async () => {
		const fetcher = vi.fn<typeof fetch>(
			async () =>
				new Response(JSON.stringify({ choices: [{ message: { content: '{"text":"halo"}' } }] }))
		);
		const call = createChatCompletion(
			{ baseUrl: 'https://x/v1', apiKey: 'rahasia', model: 'm' },
			fetcher
		);
		const content = await call('sistem', 'pengguna', AbortSignal.timeout(1000));
		expect(content).toBe('{"text":"halo"}');
		const [url, init] = fetcher.mock.calls[0] ?? [];
		expect(url).toBe('https://x/v1/chat/completions');
		const headers = new Headers(init?.headers);
		expect(headers.get('authorization')).toBe('Bearer rahasia');
		const body = JSON.parse(String(init?.body));
		expect(body.model).toBe('m');
		expect(body.messages[0]).toEqual({ role: 'system', content: 'sistem' });
		expect(body.response_format).toEqual({ type: 'json_object' });
	});

	it('melempar galat saat status bukan 2xx atau isi kosong', async () => {
		const bad = createChatCompletion(
			{ baseUrl: 'https://x', apiKey: 'k', model: 'm' },
			async () => new Response('{}', { status: 503 })
		);
		await expect(bad('s', 'u', AbortSignal.timeout(1000))).rejects.toThrow('503');
		const empty = createChatCompletion(
			{ baseUrl: 'https://x', apiKey: 'k', model: 'm' },
			async () => new Response(JSON.stringify({ choices: [{ message: { content: null } }] }))
		);
		await expect(empty('s', 'u', AbortSignal.timeout(1000))).rejects.toThrow('missing');
	});
});
