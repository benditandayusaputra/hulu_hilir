import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { attributeCauses, replay, scenarioById, type Action, type Scenario } from '$lib/sim';
import { availableActionsFor, buildNarrationPayload } from './payload';
import { NarrationPayloadSchema } from './schemas';
import type { DetectedTrigger } from './triggers';

function scenario(id: string): Scenario {
	const found = scenarioById(id);
	if (found === null) throw new Error(`scenario ${id} missing`);
	return found;
}

describe('buildNarrationPayload', () => {
	const actions: Action[] = [
		{ month: 1, type: 'change_land_use', target: 'S2-L1', choice: 'factory' }
	];
	const history = replay(scenario('desa'), 2026, actions, 3);
	const current = history.snapshots[3];
	const baseline = history.snapshots[2];
	if (current === undefined || baseline === undefined) throw new Error('history incomplete');
	const trigger: DetectedTrigger = {
		kind: 'status_change',
		priority: 'medium',
		segments: [2],
		detail: '',
		action: null
	};

	it('membangun payload yang lolos skema dengan angka terbulatkan', () => {
		const payload = buildNarrationPayload({
			trigger,
			current,
			baseline,
			audience: 'sma',
			calendarMonth: 3,
			season: 'wet',
			causes: (segment) => attributeCauses(current, segment)
		});
		expect(v.safeParse(NarrationPayloadSchema, payload).success).toBe(true);
		expect(payload.calendarMonth).toBe('Maret');
		expect(payload.season).toBe('Musim hujan');
		expect(payload.segments[0]?.id).toBe(2);
		expect(payload.segments[0]?.name).toBe('Hulu');
		expect(Number.isInteger((payload.segments[0]?.ip ?? 0) * 10 + 1e-9 * 0)).toBe(true);
		expect(payload.causes.some((cause) => cause.type === 'season')).toBe(true);
		expect(payload.causes.find((cause) => cause.type === 'load')?.source).toBe('Pabrik tanpa IPAL');
		expect(payload.availableActions).toContain('ipal_industrial');
	});

	it('menandai kejadian dan intervensi sebagai sebab', () => {
		const eventPayload = buildNarrationPayload({
			trigger: { kind: 'event', priority: 'high', segments: [2], detail: 'drought', action: null },
			current,
			baseline,
			audience: 'smp',
			calendarMonth: 7,
			season: 'dry',
			causes: (segment) => attributeCauses(current, segment)
		});
		expect(eventPayload.detail).toBe('Kemarau panjang');
		expect(eventPayload.causes).toContainEqual({ type: 'event', event: 'Kemarau panjang' });
	});

	it('menyarankan aksi sesuai lahan segmen', () => {
		expect(availableActionsFor(current, 2)).toContain('greenbelt');
		expect(availableActionsFor(current, 3)).toContain('ipal_communal');
		expect(availableActionsFor(current, 3)).toContain('eco_farming');
	});
});
