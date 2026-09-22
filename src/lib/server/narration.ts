import * as v from 'valibot';
import { foreignNumbers } from '$lib/ai/numbers';
import {
	NarrationOutputSchema,
	type NarrationPayload,
	type NarrationResult
} from '$lib/ai/schemas';
import { NARRATION_MAX_WORDS, narrateTemplate } from '$lib/ai/template';
import { limitWords, normalizeWhitespace, replaceEmDash, stripCodeFence } from '$lib/ai/text';
import { factIds } from '$lib/content/facts';
import type { LlmCall } from './llm';
import { systemPrompt, userMessage } from './prompt';

export const NARRATION_TIMEOUT_MS = 8000;
const CACHE_LIMIT = 200;

export type NarrationCache = Map<string, NarrationResult>;

export interface NarrateOptions {
	timeoutMs?: number;
	cache?: NarrationCache;
}

export function acceptOutput(raw: string, payload: NarrationPayload): NarrationResult | null {
	let json: unknown;
	try {
		json = JSON.parse(stripCodeFence(raw));
	} catch {
		return null;
	}
	const parsed = v.safeParse(NarrationOutputSchema, json);
	if (!parsed.success) return null;
	const output = parsed.output;
	const text = normalizeWhitespace(replaceEmDash(output.text));
	if (text === '' || foreignNumbers(text, payload).length > 0) return null;
	const suggested = payload.availableActions.find((action) => action === output.suggestedAction);
	return {
		text: limitWords(text, NARRATION_MAX_WORDS),
		source: 'ai',
		highlightSegments: [...new Set(output.highlightSegments)],
		suggestedAction: suggested ?? null,
		factId: factIds.find((id) => id === output.factId) ?? null
	};
}

function remember(cache: NarrationCache, key: string, result: NarrationResult): void {
	if (cache.size >= CACHE_LIMIT) {
		const oldest = cache.keys().next().value;
		if (oldest !== undefined) cache.delete(oldest);
	}
	cache.set(key, result);
}

export async function narrate(
	payload: NarrationPayload,
	llm: LlmCall | null,
	options: NarrateOptions = {}
): Promise<NarrationResult> {
	const fallback = narrateTemplate(payload);
	if (llm === null) return fallback;
	const cache = options.cache;
	const key = JSON.stringify(payload);
	const cached = cache?.get(key);
	if (cached !== undefined) return cached;
	try {
		const raw = await llm(
			systemPrompt(payload.audience),
			userMessage(payload),
			AbortSignal.timeout(options.timeoutMs ?? NARRATION_TIMEOUT_MS)
		);
		const accepted = acceptOutput(raw, payload);
		if (accepted === null) return fallback;
		if (cache !== undefined) remember(cache, key, accepted);
		return accepted;
	} catch {
		return fallback;
	}
}
