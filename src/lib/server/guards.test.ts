import { describe, expect, it } from 'vitest';
import { samplePayload } from '$lib/ai/samplePayload';
import { MAX_BODY_BYTES, originAllowed, parseNarrationBody } from './guards';

describe('originAllowed', () => {
	it('menerima origin sendiri atau ALLOWED_ORIGIN dan menolak lainnya', () => {
		expect(originAllowed('https://hulu.example', 'https://hulu.example', undefined)).toBe(true);
		expect(originAllowed('https://lain.example', 'https://hulu.example', undefined)).toBe(false);
		expect(
			originAllowed('https://lain.example', 'https://hulu.example', 'https://lain.example/')
		).toBe(true);
		expect(originAllowed(null, 'https://hulu.example', 'https://hulu.example')).toBe(false);
	});
});

describe('parseNarrationBody', () => {
	it('menerima payload valid dan menolak field tambahan, JSON rusak, atau body terlalu besar', () => {
		expect(parseNarrationBody(JSON.stringify(samplePayload()))?.trigger).toBe('status_change');
		expect(parseNarrationBody(JSON.stringify({ ...samplePayload(), extra: 1 }))).toBeNull();
		expect(parseNarrationBody('{')).toBeNull();
		expect(parseNarrationBody('x'.repeat(MAX_BODY_BYTES + 1))).toBeNull();
	});
});
