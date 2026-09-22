import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { originAllowed, parseNarrationBody } from '$lib/server/guards';
import { createChatCompletion, llmConfigFrom } from '$lib/server/llm';
import { narrate, type NarrationCache } from '$lib/server/narration';
import { RateLimiter } from '$lib/server/rateLimit';

export const prerender = false;

const NARRATION_PER_MINUTE = 30;
const NARRATION_PER_DAY = 2000;
const UNKNOWN_ADDRESS = 'unknown';

const limiter = new RateLimiter({
	capacity: NARRATION_PER_MINUTE,
	refillPerMinute: NARRATION_PER_MINUTE,
	dailyLimit: NARRATION_PER_DAY
});
const cache: NarrationCache = new Map();

function addressOf(getClientAddress: () => string): string {
	try {
		return getClientAddress();
	} catch {
		return UNKNOWN_ADDRESS;
	}
}

export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
	if (!originAllowed(request.headers.get('origin'), url.origin, env['ALLOWED_ORIGIN'])) {
		return json({ error: 'origin' }, { status: 403 });
	}
	if (!limiter.take(addressOf(getClientAddress))) {
		return json({ error: 'rate_limit' }, { status: 429 });
	}
	const payload = parseNarrationBody(await request.text());
	if (payload === null) return json({ error: 'payload' }, { status: 400 });
	const config = llmConfigFrom(env);
	const llm = config === null ? null : createChatCompletion(config);
	return json(await narrate(payload, llm, { cache }));
};
