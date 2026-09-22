import { evaluateMission } from './evaluate';
import { replay } from './replay';
import type { Action, DecisionImpact, Indicators, MissionDefinition, Scenario } from './types';

function indicatorDeltas(full: Indicators, without: Indicators): Indicators {
	return {
		waterQuality: full.waterQuality - without.waterQuality,
		fish: full.fish - without.fish,
		floodRisk: full.floodRisk - without.floodRisk,
		economy: full.economy - without.economy
	};
}

export function measureDecisionImpact(
	scenario: Scenario,
	seed: number,
	actions: readonly Action[],
	mission: MissionDefinition
): DecisionImpact[] {
	const full = evaluateMission(replay(scenario, seed, actions, mission.months), mission);
	const impacts = actions.map((action, i): DecisionImpact => {
		const without = actions.filter((_, j) => j !== i);
		const result = evaluateMission(replay(scenario, seed, without, mission.months), mission);
		return {
			action,
			scoreDelta: full.score - result.score,
			indicatorDeltas: indicatorDeltas(full.indicators, result.indicators)
		};
	});
	return impacts.sort((left, right) => Math.abs(right.scoreDelta) - Math.abs(left.scoreDelta));
}
