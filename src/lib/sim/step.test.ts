import { describe, expect, it } from 'vitest';
import { finalState, replay } from './replay';
import { defineScenario, layout, scenarios } from './scenarios';
import { createInitialState } from './state';
import { stepMonth } from './step';
import type { Action, Scenario } from './types';

const natural = scenarios['alami'] ?? defineScenario({ id: 'x', tiles: layout('forest') });

function scenario(id: string, overrides: Partial<Scenario>): Scenario {
	return defineScenario({ id, tiles: layout('forest'), ...overrides });
}

describe('state awal', () => {
	it('membangun 24 petak, 6 segmen, kas sesuai anggaran, dan indikator awal', () => {
		const state = createInitialState(scenarios['hulu-gundul'] ?? natural, 7);
		expect(state.tiles).toHaveLength(24);
		expect(state.segments).toHaveLength(6);
		expect(state.cash).toBe(20);
		expect(state.month).toBe(0);
		expect(state.indicators.economy).toBeCloseTo(100);
		expect(state.indicators.floodRisk).toBeGreaterThan(30);
		expect(state.tiles[0]?.landUse).toBe('open_land');
		expect(createInitialState(natural, 7).cash).toBeNull();
	});

	it('menerapkan override stok dan ikan per segmen', () => {
		const custom = scenario('override', {
			segmentOverrides: { 6: { hyacinth: 0.4, litter: 50, sediment: 0.3, fish: { sensitive: 0 } } }
		});
		const state = createInitialState(custom, 1);
		expect(state.segments[5]?.hyacinth).toBe(0.4);
		expect(state.segments[5]?.litter).toBe(50);
		expect(state.segments[5]?.sediment).toBe(0.3);
		expect(state.segments[5]?.fish.sensitive).toBe(0);
		expect(state.segments[5]?.fish.tolerant).toBe(0.5);
	});
});

describe('langkah bulanan', () => {
	it('memajukan bulan, mengubah state RNG, dan menyimpan kejadian serta perubahan', () => {
		const start = createInitialState(natural, 11);
		const result = stepMonth(start, []);
		expect(result.state.month).toBe(1);
		expect(result.state.rngState).not.toBe(start.rngState);
		expect(result.events).toBe(result.state.events);
		expect(result.changes).toBe(result.state.changes);
	});

	it('menerapkan aksi bulan ini, menagih biaya rutin, dan menghentikan intervensi saat kas habis', () => {
		const tight = scenario('kas-tipis', {
			tiles: layout('forest', { 'S2-L1': 'factory' }),
			budget: { initial: 8, monthly: 0 },
			mission: true
		});
		const start = createInitialState(tight, 1);
		const actions: Action[] = [{ month: 1, type: 'ipal_industrial', target: 'S2-L1' }];
		const history = replay(tight, 1, actions, 4);
		expect(history.snapshots[1]?.cash).toBeCloseTo(0);
		expect(history.snapshots[3]?.upkeepPaid).toBe(false);
		expect(finalState(history).tiles[4]?.interventions[0]?.type).toBe('ipal_industrial');
		expect(start.cash).toBe(8);
	});

	it('mengabaikan aksi yang ditolak tanpa menghentikan langkah', () => {
		const start = createInitialState(natural, 1);
		const bad: Action = { month: 1, type: 'ipal_industrial', target: 'S1-L1' };
		expect(stepMonth(start, [bad]).state.tiles[0]?.interventions).toEqual([]);
	});

	it('menambah sampah dan sampah ke laut dari permukiman', () => {
		const city = scenarios['kota-padat'] ?? natural;
		const state = finalState(replay(city, 1, [], 6));
		expect(state.segments[3]?.litter).toBeGreaterThan(0);
		expect(state.litterToSeaTotal).toBeGreaterThan(0);
		expect(state.litterToSea).toBeGreaterThanOrEqual(0);
	});

	it('menjalankan Kemarau Panjang terjadwal selama beberapa bulan', () => {
		const dry = scenario('kemarau', { scheduledEvents: [{ month: 7, type: 'drought' }] });
		const history = replay(dry, 1, [], 9);
		expect(history.snapshots[7]?.events.some((event) => event.type === 'drought')).toBe(true);
		expect(history.snapshots[7]?.droughtMonthsLeft).toBeGreaterThanOrEqual(2);
		expect(history.snapshots[8]?.droughtMonthsLeft).toBe(
			(history.snapshots[7]?.droughtMonthsLeft ?? 0) - 1
		);
		const wet = replay(natural, 1, [], 9);
		expect(history.snapshots[8]?.segments[0]?.flow).toBeLessThan(
			wet.snapshots[8]?.segments[0]?.flow ?? 0
		);
		expect(history.snapshots[8]?.segments[0]?.temperature).toBeGreaterThan(
			wet.snapshots[8]?.segments[0]?.temperature ?? 0
		);
	});

	it('mencatat banjir nyata dengan warga terdampak, gagal panen, dan sampah kiriman', () => {
		const bare = scenario('banjir', {
			tiles: layout('open_land', { 'S4-L1': 'dense_settlement', 'S4-L2': 'paddy' }),
			scheduledEvents: [{ month: 1, type: 'extreme_rain' }]
		});
		const state = replay(bare, 1, [], 1).snapshots[1];
		const flood = state?.events.find((event) => event.type === 'flood' && event.segment === 4);
		expect(flood).toBeDefined();
		expect(state?.affectedResidents).toBeGreaterThan(0);
		expect(state?.losses).toBeGreaterThan(0);
		expect(state?.events.some((event) => event.type === 'litter_shipment')).toBe(true);
		expect(state?.changes.some((change) => change.kind === 'flood')).toBe(true);
		expect(state?.segments[3]?.floodStatus).not.toBe('safe');
		const paddyRevenue = state?.economy.revenue ?? 0;
		expect(paddyRevenue).toBeCloseTo(1.0);
	});

	it('memicu Banjir Rob di muara berpermukiman saat muka laut naik dan pintu air mencegahnya', () => {
		const rob = scenarios['rob-muara'] ?? natural;
		const flooded = replay(rob, 1, [], 3);
		expect(flooded.snapshots.some((s) => s.events.some((e) => e.type === 'rob_flood'))).toBe(true);
		const gated = replay(
			{ ...rob, budget: null },
			1,
			[{ month: 1, type: 'floodgate', target: 'S6' }],
			12
		);
		const afterGate = gated.snapshots.slice(8);
		expect(afterGate.some((s) => s.events.some((e) => e.type === 'rob_flood'))).toBe(false);
	});

	it('mencatat pergantian status, ledakan eceng gondok, dan ekowisata', () => {
		const rich = scenarios['kota-padat'] ?? natural;
		const history = replay(rich, 2, [], 12);
		const events = history.snapshots.flatMap((s) => s.events.map((e) => e.type));
		expect(events).toContain('hyacinth_bloom');
		const changes = history.snapshots.flatMap((s) => s.changes.map((c) => c.kind));
		expect(changes).toContain('status_change');
		const calm = replay(natural, 2, [], 8);
		expect(calm.snapshots.flatMap((s) => s.events.map((e) => e.type))).toContain('ecotourism');
		expect(finalState(calm).indicators.economy).toBeCloseTo(100);
	});

	it('mematangkan hutan yang ditanam dan sabuk hijau dari bulan ke bulan', () => {
		const bare = scenario('reboisasi', { tiles: layout('open_land') });
		const actions: Action[] = [
			{ month: 1, type: 'plant_forest', target: 'S1-L1' },
			{ month: 1, type: 'greenbelt', target: 'S1' }
		];
		const state = finalState(replay(bare, 1, actions, 6));
		expect(state.tiles[0]?.landUse).toBe('forest');
		expect(state.tiles[0]?.forestMaturity).toBeCloseTo(6 / 30);
		expect(state.segments[0]?.greenbeltMaturity).toBeCloseTo(6 / 12);
	});

	it('menghukum ekonomi pabrik tanpa IPAL saat Pengawasan aktif dan memasukkan denda ke kas', () => {
		const factories = scenario('pengawasan', {
			tiles: layout('forest', { 'S2-L1': 'factory', 'S3-L1': 'factory' }),
			budget: { initial: 5, monthly: 0 },
			mission: true
		});
		const plain = replay(factories, 1, [], 2);
		const watched = replay(factories, 1, [{ month: 1, type: 'enforcement', target: 'river' }], 2);
		expect(finalState(watched).indicators.economy).toBeLessThan(
			finalState(plain).indicators.economy
		);
		expect(finalState(watched).cashReceived).toBeGreaterThan(finalState(plain).cashReceived);
	});
});
