import { describe, expect, it } from 'vitest';
import { rollEvents } from './events';
import { RngStream, seedState } from './rng';
import { defineScenario, layout, scenarios } from './scenarios';
import { createInitialState } from './state';
import type { ScheduledEvent, SimState } from './types';

function withScheduled(state: SimState, scheduledEvents: ScheduledEvent[]): SimState {
	return { ...state, scenario: { ...state.scenario, scheduledEvents } };
}

const factories = defineScenario({
	id: 'pabrik',
	tiles: layout('forest', { 'S2-L1': 'factory', 'S3-L1': 'factory' })
});

describe('kejadian bulanan', () => {
	const natural = createInitialState(scenarios['alami'] ?? factories, 3);

	it('memicu kejadian terjadwal tanpa bergantung pada RNG', () => {
		const state = withScheduled(natural, [
			{ month: 1, type: 'extreme_rain', day: 20 },
			{ month: 1, type: 'drought' },
			{ month: 1, type: 'landslide', segment: 2 }
		]);
		const roll = rollEvents(state, 1, 1, 31, new RngStream(seedState(3)));
		const types = roll.events.map((event) => event.type);
		expect(types).toEqual(['extreme_rain', 'drought', 'landslide']);
		expect(roll.rainIntensity).toBe(70);
		expect(roll.rainDay).toBe(20);
		expect(roll.events[1]?.value).toBeGreaterThanOrEqual(3);
		expect(roll.events[1]?.value).toBeLessThanOrEqual(4);
		expect(roll.lastEventMonth.drought).toBe(1);
	});

	it('menjatuhkan pembuangan ilegal terjadwal ke pabrik pertama bila segmen tidak disebut', () => {
		const state = withScheduled(createInitialState(factories, 1), [
			{ month: 2, type: 'illegal_dumping' }
		]);
		const roll = rollEvents(state, 2, 2, 28, new RngStream(seedState(1)));
		expect(roll.events.find((event) => event.type === 'illegal_dumping')?.segment).toBe(2);
		const clean = withScheduled(natural, [{ month: 2, type: 'illegal_dumping' }]);
		expect(
			rollEvents(clean, 2, 2, 28, new RngStream(seedState(1))).events.some(
				(event) => event.type === 'illegal_dumping'
			)
		).toBe(false);
	});

	it('menghasilkan hujan lebat pada peluang tinggi dan tidak pada peluang nol', () => {
		let rainy = 0;
		for (let seed = 1; seed <= 40; seed += 1) {
			const roll = rollEvents(natural, 1, 2, 28, new RngStream(seedState(seed)));
			if (roll.rainIntensity > 0) rainy += 1;
			expect(roll.rainDay).toBeGreaterThanOrEqual(1);
			expect(roll.rainDay).toBeLessThanOrEqual(28);
			expect(Math.abs(roll.cloudVariation)).toBeLessThanOrEqual(0.15);
		}
		expect(rainy).toBeGreaterThan(10);
	});

	it('membatasi satu kejadian negatif acak per bulan dan memberi jeda enam bulan', () => {
		const state = createInitialState(factories, 1);
		let dumped = 0;
		for (let seed = 1; seed <= 200; seed += 1) {
			const roll = rollEvents(state, 3, 3, 31, new RngStream(seedState(seed)));
			const negatives = roll.events.filter((event) =>
				['drought', 'illegal_dumping', 'landslide'].includes(event.type)
			);
			expect(negatives.length).toBeLessThanOrEqual(1);
			if (negatives[0]?.type === 'illegal_dumping') dumped += 1;
		}
		expect(dumped).toBeGreaterThan(0);
		const cooled = { ...state, lastEventMonth: { illegal_dumping: 1 } };
		for (let seed = 1; seed <= 200; seed += 1) {
			const roll = rollEvents(cooled, 3, 3, 31, new RngStream(seedState(seed)));
			expect(roll.events.some((event) => event.type === 'illegal_dumping')).toBe(false);
		}
	});

	it('hanya memulai Kemarau Panjang di bulan kemarau dan setelah jeda 24 bulan', () => {
		let started = 0;
		for (let seed = 1; seed <= 200; seed += 1) {
			const dry = rollEvents(natural, 30, 7, 31, new RngStream(seedState(seed)));
			if (dry.events.some((event) => event.type === 'drought')) started += 1;
			const wet = rollEvents(natural, 30, 1, 31, new RngStream(seedState(seed)));
			expect(wet.events.some((event) => event.type === 'drought')).toBe(false);
			const recent = { ...natural, lastEventMonth: { drought: 20 } };
			const blocked = rollEvents(recent, 30, 7, 31, new RngStream(seedState(seed)));
			expect(blocked.events.some((event) => event.type === 'drought')).toBe(false);
		}
		expect(started).toBeGreaterThan(0);
	});

	it('memicu Komunitas Peduli Sungai hanya dengan dua bank sampah aktif', () => {
		const village = defineScenario({
			id: 'desa',
			tiles: layout('forest', { 'S3-L1': 'settlement', 'S4-L1': 'settlement' })
		});
		const base = createInitialState(village, 1);
		const banked: SimState = {
			...base,
			tiles: base.tiles.map((tile) =>
				tile.landUse === 'settlement'
					? { ...tile, interventions: [{ type: 'waste_bank', activeFrom: 1 }] }
					: tile
			)
		};
		let fired = 0;
		for (let seed = 1; seed <= 200; seed += 1) {
			const roll = rollEvents(banked, 5, 5, 31, new RngStream(seedState(seed)));
			const community = roll.events.find((event) => event.type === 'community');
			if (community) {
				fired += 1;
				expect([3, 4]).toContain(community.segment);
			}
			expect(
				rollEvents(base, 5, 5, 31, new RngStream(seedState(seed))).events.some(
					(e) => e.type === 'community'
				)
			).toBe(false);
		}
		expect(fired).toBeGreaterThan(0);
	});

	it('mengurangi peluang pembuangan ilegal saat Pengawasan aktif dan memicu longsor di tebing gundul', () => {
		const state = createInitialState(factories, 1);
		const enforced: SimState = {
			...state,
			riverInterventions: [{ type: 'enforcement', activeFrom: 1 }]
		};
		const count = (target: SimState, type: string): number => {
			let total = 0;
			for (let seed = 1; seed <= 300; seed += 1) {
				const roll = rollEvents(target, 3, 3, 31, new RngStream(seedState(seed)));
				if (roll.events.some((event) => event.type === type)) total += 1;
			}
			return total;
		};
		expect(count(enforced, 'illegal_dumping')).toBeLessThan(count(state, 'illegal_dumping'));
		const bare = createInitialState(scenarios['lahan-kosong'] ?? factories, 1);
		expect(count(bare, 'landslide')).toBeGreaterThan(0);
		expect(count(natural, 'landslide')).toBe(0);
	});
});
