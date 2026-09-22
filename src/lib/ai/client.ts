import { env } from '$env/dynamic/public';
import * as v from 'valibot';
import { foreignNumbers } from './numbers';
import { NarrationResultSchema, type NarrationPayload, type NarrationResult } from './schemas';
import { narrateTemplate } from './template';

export const NARRATION_TIMEOUT_MS = 8000;
export const narrationEndpoint = '/api/ai/narration';

export type AiMode = 'server' | 'off';

export function aiMode(): AiMode {
	return env.PUBLIC_AI_MODE === 'server' ? 'server' : 'off';
}

export function aiAvailable(): boolean {
	if (aiMode() !== 'server') return false;
	return typeof navigator === 'undefined' || navigator.onLine !== false;
}

export async function fetchNarration(
	payload: NarrationPayload,
	fetcher: typeof fetch = fetch
): Promise<NarrationResult> {
	const fallback = narrateTemplate(payload);
	if (!aiAvailable()) return fallback;
	try {
		const response = await fetcher(narrationEndpoint, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload),
			signal: AbortSignal.timeout(NARRATION_TIMEOUT_MS)
		});
		if (!response.ok) return fallback;
		const parsed = v.safeParse(NarrationResultSchema, await response.json());
		if (!parsed.success) return fallback;
		if (parsed.output.source === 'ai' && foreignNumbers(parsed.output.text, payload).length > 0) {
			return fallback;
		}
		return parsed.output;
	} catch {
		return fallback;
	}
}
