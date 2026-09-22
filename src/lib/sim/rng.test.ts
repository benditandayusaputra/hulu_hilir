import { describe, expect, it } from 'vitest';
import { RngStream, nextFloat, seedState } from './rng';

describe('mulberry32', () => {
	it('menghasilkan urutan yang sama untuk seed yang sama', () => {
		const first = new RngStream(seedState(42));
		const second = new RngStream(seedState(42));
		const a = [first.float(), first.float(), first.float()];
		const b = [second.float(), second.float(), second.float()];
		expect(a).toEqual(b);
	});

	it('menghasilkan urutan berbeda untuk seed berbeda', () => {
		expect(nextFloat(seedState(1)).value).not.toBe(nextFloat(seedState(2)).value);
	});

	it('selalu berada di rentang 0 sampai di bawah 1', () => {
		const rng = new RngStream(seedState(7));
		for (let i = 0; i < 1000; i += 1) {
			const value = rng.float();
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it('tidak mengubah state masukan pada nextFloat', () => {
		const state = seedState(99);
		const draw = nextFloat(state);
		expect(draw.state).not.toBe(state);
		expect(nextFloat(state)).toEqual(draw);
	});

	it('membatasi pickIndex ke indeks terakhir dan range ke batasnya', () => {
		const rng = new RngStream(seedState(3));
		for (let i = 0; i < 200; i += 1) {
			expect(rng.pickIndex(4)).toBeLessThanOrEqual(3);
			const value = rng.range(2, 5);
			expect(value).toBeGreaterThanOrEqual(2);
			expect(value).toBeLessThan(5);
		}
		expect(rng.chance(1)).toBe(true);
		expect(rng.chance(0)).toBe(false);
	});
});
