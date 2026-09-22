import { describe, expect, it } from 'vitest';
import {
	createInitialState,
	replay,
	scenarioById,
	stepMonth,
	type Action,
	type NotableChange,
	type Scenario,
	type StepResult
} from '$lib/sim';
import { detectTrigger, INTERVENTION_EFFECT_DELAY_MONTHS } from './triggers';

function scenario(id: string): Scenario {
	const found = scenarioById(id);
	if (found === null) throw new Error(`scenario ${id} missing`);
	return found;
}

function resultWith(changes: NotableChange[], month: number): StepResult {
	const state = { ...createInitialState(scenario('alami'), 1), month };
	return { state, events: [], changes };
}

describe('detectTrigger', () => {
	it('mendeteksi status berubah setelah pabrik dipasang di hulu', () => {
		const actions: Action[] = [
			{ month: 1, type: 'change_land_use', target: 'S2-L1', choice: 'factory' }
		];
		let state = createInitialState(scenario('desa'), 2026);
		const snapshots = [state];
		let found = null;
		for (let month = 1; month <= 12 && found === null; month += 1) {
			const result = stepMonth(
				state,
				actions.filter((action) => action.month === month)
			);
			state = result.state;
			snapshots.push(state);
			const trigger = detectTrigger(result, snapshots);
			if (trigger?.kind === 'status_change') found = trigger;
		}
		expect(found?.priority).toBe('medium');
		expect(found?.segments.length).toBeGreaterThan(0);
	});

	it('mengurutkan prioritas: banjir, ikan mati, kejadian, lalu status', () => {
		const flood: NotableChange = { kind: 'flood', segment: 4, before: '', after: '1.2' };
		const kill: NotableChange = { kind: 'fish_kill', segment: 3, before: '', after: '' };
		const event: NotableChange = { kind: 'event', segment: 2, before: '', after: 'drought' };
		const status: NotableChange = {
			kind: 'status_change',
			segment: 5,
			before: 'good',
			after: 'light'
		};
		expect(detectTrigger(resultWith([status, event, kill, flood], 3), [])?.kind).toBe('flood');
		expect(detectTrigger(resultWith([status, event, kill], 3), [])?.kind).toBe('fish_kill');
		expect(detectTrigger(resultWith([status, event], 3), [])?.kind).toBe('event');
		expect(detectTrigger(resultWith([status, event], 3), [])?.detail).toBe('drought');
		expect(detectTrigger(resultWith([status], 3), [])?.kind).toBe('status_change');
	});

	it('mengabaikan hujan lebat rutin dan memberi ringkasan tiap 12 bulan', () => {
		const rain: NotableChange = { kind: 'event', segment: null, before: '', after: 'heavy_rain' };
		expect(detectTrigger(resultWith([rain], 5), [])).toBeNull();
		expect(detectTrigger(resultWith([rain], 12), [])?.kind).toBe('yearly_summary');
		expect(detectTrigger(resultWith([], 24), [])?.priority).toBe('low');
	});

	it('menjelaskan efek intervensi tiga bulan setelah dipasang', () => {
		const action: Action = { month: 2, type: 'greenbelt', target: '3' };
		const history = replay(scenario('alami'), 7, [action], 2 + INTERVENTION_EFFECT_DELAY_MONTHS);
		const last = history.snapshots[history.snapshots.length - 1];
		if (last === undefined) throw new Error('history empty');
		const trigger = detectTrigger({ state: last, events: [], changes: [] }, history.snapshots);
		expect(trigger?.kind).toBe('intervention_effect');
		expect(trigger?.segments).toEqual([3]);
		expect(trigger?.action?.type).toBe('greenbelt');
		expect(trigger?.detail).toBe('greenbelt');
	});
});
