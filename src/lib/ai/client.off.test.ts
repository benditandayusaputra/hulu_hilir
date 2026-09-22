import { describe, expect, it, vi } from 'vitest';
import { aiMode, fetchNarration } from './client';
import { samplePayload } from './samplePayload';

vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_AI_MODE: 'off' } }));

describe('fetchNarration saat AI mati', () => {
	it('tidak pernah memanggil jaringan dan memakai template', async () => {
		const fetcher = vi.fn<typeof fetch>();
		expect(aiMode()).toBe('off');
		const result = await fetchNarration(samplePayload(), fetcher);
		expect(result.source).toBe('template');
		expect(fetcher).not.toHaveBeenCalled();
	});
});
