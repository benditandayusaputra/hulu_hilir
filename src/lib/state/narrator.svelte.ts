import { aiAvailable, fetchNarration } from '$lib/ai/client';
import type { NarrationPayload, NarrationResult, NarrationTrigger } from '$lib/ai/schemas';
import type { TriggerPriority } from '$lib/ai/triggers';
import { narration } from '$lib/content/narration';
import { announcer } from './announcer.svelte';
import { settings } from './settings.svelte';

export const MIN_GAP_MS = 4000;
export const HISTORY_LIMIT = 10;
export const FAST_SPEED = 4;

export interface NarrationEntry extends NarrationResult {
	id: number;
	month: number;
	trigger: NarrationTrigger;
}

interface QueuedNarration {
	payload: NarrationPayload;
	priority: TriggerPriority;
}

export type NarrationRequest = (payload: NarrationPayload) => Promise<NarrationResult>;

export class Narrator {
	entries = $state<NarrationEntry[]>([]);
	busy = $state(false);
	private readonly request: NarrationRequest;
	private readonly now: () => number;
	private queued: QueuedNarration | null = null;
	private inFlight = false;
	private lastShownAt = Number.NEGATIVE_INFINITY;
	private timer: ReturnType<typeof setTimeout> | null = null;
	private nextId = 1;

	constructor(request: NarrationRequest = fetchNarration, now: () => number = () => Date.now()) {
		this.request = request;
		this.now = now;
	}

	consider(payload: NarrationPayload, priority: TriggerPriority, speed: number): void {
		const frequency = settings.narrationFrequency;
		if (frequency === 'off') return;
		if (frequency === 'important' && priority !== 'high') return;
		if (speed >= FAST_SPEED && priority !== 'high') return;
		this.queued = { payload, priority };
		this.schedule();
	}

	clear(): void {
		this.queued = null;
		this.entries = [];
		this.busy = false;
		if (this.timer !== null) clearTimeout(this.timer);
		this.timer = null;
	}

	private schedule(): void {
		if (this.inFlight || this.timer !== null) return;
		const wait = Math.max(0, this.lastShownAt + MIN_GAP_MS - this.now());
		this.timer = setTimeout(() => {
			this.timer = null;
			void this.run();
		}, wait);
	}

	private async run(): Promise<void> {
		const next = this.queued;
		this.queued = null;
		if (next === null) return;
		this.inFlight = true;
		if (aiAvailable()) {
			this.busy = true;
			announcer.announce(narration.writing);
		}
		const result = await this.request(next.payload);
		this.busy = false;
		this.inFlight = false;
		this.lastShownAt = this.now();
		const entry: NarrationEntry = {
			...result,
			id: this.nextId,
			month: next.payload.month,
			trigger: next.payload.trigger
		};
		this.nextId += 1;
		this.entries = [entry, ...this.entries].slice(0, HISTORY_LIMIT);
		announcer.announce(result.text);
		if (this.queued !== null) this.schedule();
	}
}

export const narrator = new Narrator();
