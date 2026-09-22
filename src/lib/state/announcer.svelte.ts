export type AnnouncementTone = 'polite' | 'assertive';

export const politeIntervalMs = 2000;

export class Announcer {
	polite = $state('');
	assertive = $state('');

	private queued: string[] = [];
	private cooldown: ReturnType<typeof setTimeout> | null = null;

	announce(message: string, tone: AnnouncementTone = 'polite'): void {
		const trimmed = message.trim();
		if (trimmed === '') return;
		if (tone === 'assertive') {
			this.assertive = trimmed;
			return;
		}
		this.queued.push(trimmed);
		this.flush();
	}

	clear(): void {
		this.queued = [];
		this.polite = '';
		this.assertive = '';
		if (this.cooldown !== null) clearTimeout(this.cooldown);
		this.cooldown = null;
	}

	private flush(): void {
		if (this.cooldown !== null) return;
		this.polite = this.queued.join(' ');
		this.queued = [];
		this.cooldown = setTimeout(() => {
			this.cooldown = null;
			if (this.queued.length > 0) this.flush();
		}, politeIntervalMs);
	}
}

export const announcer = new Announcer();
