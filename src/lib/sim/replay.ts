import { createInitialState } from './state';
import { stepMonth } from './step';
import type { Action, Scenario, SimHistory, SimState } from './types';

export function actionsForMonth(actions: readonly Action[], month: number): Action[] {
	return actions.filter((action) => action.month === month);
}

export function replay(
	scenario: Scenario,
	seed: number,
	actions: readonly Action[],
	months: number
): SimHistory {
	const snapshots: SimState[] = [createInitialState(scenario, seed)];
	let current = snapshots[0];
	for (let month = 1; month <= months && current; month += 1) {
		current = stepMonth(current, actionsForMonth(actions, month)).state;
		snapshots.push(current);
	}
	return { scenario, seed, actions, snapshots };
}

export function finalState(history: SimHistory): SimState {
	const last = history.snapshots[history.snapshots.length - 1];
	if (!last) throw new Error('history has no snapshots');
	return last;
}
