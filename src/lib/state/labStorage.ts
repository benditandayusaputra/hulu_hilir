import * as v from 'valibot';
import { browser } from '$app/environment';
import { actionTypes, replay, type Action, type Scenario, type SimState } from '$lib/sim';

export const labSessionSchemaVersion = 1;

export function labSessionKey(preset: string): string {
	return `hh:session:lab:${preset}`;
}

const StoredActionSchema = v.object({
	month: v.pipe(v.number(), v.integer(), v.minValue(1)),
	type: v.picklist(actionTypes),
	target: v.string(),
	choice: v.optional(v.string())
});

const StoredLabSessionSchema = v.object({
	schemaVersion: v.literal(labSessionSchemaVersion),
	preset: v.string(),
	seed: v.pipe(v.number(), v.integer()),
	month: v.pipe(v.number(), v.integer(), v.minValue(0)),
	actions: v.array(StoredActionSchema)
});

export interface StoredLabSession {
	preset: string;
	seed: number;
	month: number;
	actions: Action[];
}

export type LabSessionRead =
	{ status: 'empty' } | { status: 'invalid' } | { status: 'ok'; session: StoredLabSession };

export function parseLabSession(raw: unknown, preset: string): StoredLabSession | null {
	const result = v.safeParse(StoredLabSessionSchema, raw);
	if (!result.success || result.output.preset !== preset) return null;
	const actions = result.output.actions.map(({ choice, ...rest }): Action =>
		choice === undefined ? rest : { ...rest, choice }
	);
	return { preset, seed: result.output.seed, month: result.output.month, actions };
}

export function readLabSession(preset: string): LabSessionRead {
	if (!browser) return { status: 'empty' };
	try {
		const stored = window.localStorage.getItem(labSessionKey(preset));
		if (stored === null) return { status: 'empty' };
		const session = parseLabSession(JSON.parse(stored), preset);
		return session === null ? { status: 'invalid' } : { status: 'ok', session };
	} catch {
		return { status: 'invalid' };
	}
}

export function clearLabSession(preset: string): void {
	if (!browser) return;
	try {
		window.localStorage.removeItem(labSessionKey(preset));
	} catch {
		return;
	}
}

export function writeLabSession(session: StoredLabSession): void {
	if (!browser) return;
	if (session.month === 0 && session.actions.length === 0) {
		clearLabSession(session.preset);
		return;
	}
	try {
		const payload = { schemaVersion: labSessionSchemaVersion, ...session };
		window.localStorage.setItem(labSessionKey(session.preset), JSON.stringify(payload));
	} catch {
		return;
	}
}

export interface ReplayedLabSession {
	snapshots: SimState[];
	pending: Action[];
}

export function replayLabSession(scenario: Scenario, stored: StoredLabSession): ReplayedLabSession {
	const done = stored.actions.filter((action) => action.month <= stored.month);
	const history = replay(scenario, stored.seed, done, stored.month);
	return {
		snapshots: [...history.snapshots],
		pending: stored.actions.filter((action) => action.month === stored.month + 1)
	};
}
