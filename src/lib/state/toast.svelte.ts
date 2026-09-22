import { announcer } from './announcer.svelte';

export type ToastTone = 'info' | 'success' | 'danger';

export interface ToastItem {
	id: number;
	message: string;
	tone: ToastTone;
}

export const toastDurationMs = 6000;
const MAX_VISIBLE_TOASTS = 3;

export class Toaster {
	items = $state<ToastItem[]>([]);
	private nextId = 1;

	show(message: string, tone: ToastTone = 'info', announce = true): void {
		const trimmed = message.trim();
		if (trimmed === '') return;
		const id = this.nextId;
		this.nextId += 1;
		this.items = [...this.items, { id, message: trimmed, tone }].slice(-MAX_VISIBLE_TOASTS);
		if (announce) announcer.announce(trimmed, tone === 'danger' ? 'assertive' : 'polite');
		setTimeout(() => this.dismiss(id), toastDurationMs);
	}

	dismiss(id: number): void {
		this.items = this.items.filter((item) => item.id !== id);
	}

	clear(): void {
		this.items = [];
	}
}

export const toaster = new Toaster();
