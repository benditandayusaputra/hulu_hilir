import { describe, expect, it } from 'vitest';
import { RateLimiter } from './rateLimit';

describe('RateLimiter', () => {
	it('mengizinkan sampai kapasitas lalu mengisi ulang seiring waktu', () => {
		let now = Date.UTC(2026, 0, 1, 8, 0, 0);
		const limiter = new RateLimiter(
			{ capacity: 3, refillPerMinute: 60, dailyLimit: 100 },
			() => now
		);
		expect(limiter.take('a')).toBe(true);
		expect(limiter.take('a')).toBe(true);
		expect(limiter.take('a')).toBe(true);
		expect(limiter.take('a')).toBe(false);
		expect(limiter.take('b')).toBe(true);
		now += 1000;
		expect(limiter.take('a')).toBe(true);
		expect(limiter.take('a')).toBe(false);
	});

	it('menghentikan semua permintaan setelah batas harian dan mereset di hari baru', () => {
		let now = Date.UTC(2026, 0, 1, 23, 59, 0);
		const limiter = new RateLimiter(
			{ capacity: 10, refillPerMinute: 10, dailyLimit: 2 },
			() => now
		);
		expect(limiter.take('a')).toBe(true);
		expect(limiter.take('b')).toBe(true);
		expect(limiter.take('c')).toBe(false);
		now += 2 * 60 * 1000;
		expect(limiter.take('c')).toBe(true);
	});
});
