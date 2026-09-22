export interface RateLimitOptions {
	capacity: number;
	refillPerMinute: number;
	dailyLimit: number;
}

interface Bucket {
	tokens: number;
	updated: number;
}

const MS_PER_MINUTE = 60000;
const MAX_TRACKED_KEYS = 1000;
const DATE_LENGTH = 10;

export class RateLimiter {
	private readonly options: RateLimitOptions;
	private readonly now: () => number;
	private readonly buckets = new Map<string, Bucket>();
	private dailyCount = 0;
	private dailyDate = '';

	constructor(options: RateLimitOptions, now: () => number = () => Date.now()) {
		this.options = options;
		this.now = now;
	}

	take(key: string): boolean {
		const time = this.now();
		const day = new Date(time).toISOString().slice(0, DATE_LENGTH);
		if (day !== this.dailyDate) {
			this.dailyDate = day;
			this.dailyCount = 0;
		}
		if (this.dailyCount >= this.options.dailyLimit) return false;
		if (this.buckets.size >= MAX_TRACKED_KEYS && !this.buckets.has(key)) this.buckets.clear();
		const bucket = this.buckets.get(key) ?? { tokens: this.options.capacity, updated: time };
		const refill = ((time - bucket.updated) / MS_PER_MINUTE) * this.options.refillPerMinute;
		bucket.tokens = Math.min(this.options.capacity, bucket.tokens + refill);
		bucket.updated = time;
		if (bucket.tokens < 1) {
			this.buckets.set(key, bucket);
			return false;
		}
		bucket.tokens -= 1;
		this.buckets.set(key, bucket);
		this.dailyCount += 1;
		return true;
	}
}
