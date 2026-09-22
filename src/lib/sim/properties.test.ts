import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { replay } from './replay';
import { defineScenario, tileOrder } from './scenarios';
import {
	actionTypes,
	landUses,
	riverInterventions,
	segmentInterventions,
	tileInterventions,
	type Action,
	type LandUse,
	type SimState
} from './types';

const targets = [...tileOrder, 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'river'];
const choices = [...landUses, ...tileInterventions, ...segmentInterventions, ...riverInterventions];
const heavierThanForest: LandUse[] = ['paddy', 'settlement', 'dense_settlement', 'open_land'];

const tilesArbitrary = fc.array(fc.constantFrom(...landUses), { minLength: 24, maxLength: 24 });
const seedArbitrary = fc.integer({ min: 0, max: 2 ** 31 - 1 });
const monthsArbitrary = fc.integer({ min: 1, max: 18 });
const actionArbitrary: fc.Arbitrary<Action> = fc.record({
	month: fc.integer({ min: 1, max: 18 }),
	type: fc.constantFrom(...actionTypes),
	target: fc.constantFrom(...targets),
	choice: fc.constantFrom(...choices)
});
const actionsArbitrary = fc.array(actionArbitrary, { maxLength: 8 });

function numbersOf(state: SimState): number[] {
	const values: number[] = [
		state.cash ?? 0,
		state.cashReceived,
		state.economy.revenue,
		state.economy.jobs,
		state.litterToSea,
		state.affectedResidents,
		state.losses,
		...Object.values(state.indicators)
	];
	for (const segment of state.segments) {
		values.push(
			segment.flow,
			segment.temperature,
			segment.shade,
			segment.doSaturation,
			segment.doDawn,
			segment.doDayMax,
			segment.pollutionIndex,
			segment.sediment,
			segment.litter,
			segment.hyacinth,
			segment.greenbeltMaturity,
			segment.floodRatio,
			...Object.values(segment.concentrations),
			...Object.values(segment.fish)
		);
	}
	return values;
}

function scenarioOf(tiles: LandUse[], mission: boolean) {
	return defineScenario({
		id: 'acak',
		tiles,
		budget: mission ? { initial: 25, monthly: 0.5 } : null,
		mission
	});
}

describe('properti mesin simulasi', () => {
	it('tidak pernah menghasilkan NaN atau nilai di luar rentang', () => {
		fc.assert(
			fc.property(
				tilesArbitrary,
				seedArbitrary,
				monthsArbitrary,
				actionsArbitrary,
				fc.boolean(),
				(tiles, seed, months, actions, mission) => {
					const history = replay(scenarioOf(tiles, mission), seed, actions, months);
					for (const state of history.snapshots) {
						for (const value of numbersOf(state)) expect(Number.isFinite(value)).toBe(true);
						for (const key of Object.values(state.indicators)) {
							expect(key).toBeGreaterThanOrEqual(0);
							expect(key).toBeLessThanOrEqual(100);
						}
						for (const segment of state.segments) {
							for (const value of Object.values(segment.concentrations))
								expect(value).toBeGreaterThanOrEqual(0);
							expect(segment.concentrations.do).toBeLessThanOrEqual(segment.doSaturation + 1e-9);
							expect(segment.doDawn).toBeLessThanOrEqual(segment.doDayMax + 1e-9);
							expect(segment.doDayMax).toBeLessThanOrEqual(1.5 * segment.doSaturation + 1e-9);
							expect(segment.doDawn).toBeGreaterThanOrEqual(0);
							for (const value of Object.values(segment.fish)) {
								expect(value).toBeGreaterThanOrEqual(0);
								expect(value).toBeLessThanOrEqual(1);
							}
							expect(segment.sediment).toBeGreaterThanOrEqual(0);
							expect(segment.sediment).toBeLessThanOrEqual(1);
							expect(segment.litter).toBeGreaterThanOrEqual(0);
							expect(segment.litter).toBeLessThanOrEqual(100);
							expect(segment.hyacinth).toBeGreaterThanOrEqual(0);
							expect(segment.hyacinth).toBeLessThanOrEqual(1);
						}
						if (state.cash !== null) expect(state.cash).toBeGreaterThanOrEqual(0);
					}
				}
			),
			{ numRuns: 40 }
		);
	});

	it('menambah beban pada petak jauh dari sungai tidak pernah memperbaiki IP segmen itu dan hilirnya', () => {
		fc.assert(
			fc.property(
				tilesArbitrary,
				seedArbitrary,
				fc.integer({ min: 0, max: 11 }),
				fc.constantFrom(...heavierThanForest),
				(tiles, seed, farTile, heavier) => {
					const index = Math.floor(farTile / 2) * 4 + (farTile % 2) * 2 + 1;
					const base = tiles.map((use, i) => (i === index ? 'forest' : use));
					const loaded = base.map((use, i) => (i === index ? heavier : use));
					const reference = replay(scenarioOf(base, false), seed, [], 12);
					const changed = replay(scenarioOf(loaded, false), seed, [], 12);
					const from = Math.floor(index / 4) + 1;
					changed.snapshots.forEach((state, month) => {
						state.segments.forEach((segment, i) => {
							if (segment.index < from) return;
							const before = reference.snapshots[month]?.segments[i]?.pollutionIndex ?? 0;
							expect(segment.pollutionIndex).toBeGreaterThanOrEqual(before - 1e-9);
						});
					});
				}
			),
			{ numRuns: 30 }
		);
	});

	it('deterministik: seed, skenario, dan log aksi yang sama menghasilkan riwayat identik', () => {
		fc.assert(
			fc.property(
				tilesArbitrary,
				seedArbitrary,
				monthsArbitrary,
				actionsArbitrary,
				(tiles, seed, months, actions) => {
					const scenario = scenarioOf(tiles, true);
					expect(replay(scenario, seed, actions, months)).toEqual(
						replay(scenario, seed, actions, months)
					);
				}
			),
			{ numRuns: 15 }
		);
	});
});
