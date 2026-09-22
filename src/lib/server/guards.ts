import * as v from 'valibot';
import { NarrationPayloadSchema, type NarrationPayload } from '$lib/ai/schemas';

export const MAX_BODY_BYTES = 16 * 1024;

export function originAllowed(
	origin: string | null,
	ownOrigin: string,
	allowedOrigin: string | undefined
): boolean {
	if (origin === null || origin === '') return false;
	if (origin === ownOrigin) return true;
	if (allowedOrigin === undefined || allowedOrigin === '') return false;
	return origin === allowedOrigin.replace(/\/+$/, '');
}

export function parseNarrationBody(body: string): NarrationPayload | null {
	if (body.length > MAX_BODY_BYTES) return null;
	let raw: unknown;
	try {
		raw = JSON.parse(body);
	} catch {
		return null;
	}
	const parsed = v.safeParse(NarrationPayloadSchema, raw);
	return parsed.success ? parsed.output : null;
}
