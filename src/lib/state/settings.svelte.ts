import { browser } from '$app/environment';

export const themeOptions = ['system', 'light', 'dark'] as const;
export const textSizeOptions = ['normal', 'large', 'larger'] as const;
export const motionOptions = ['system', 'full', 'reduced'] as const;
export const narrationOptions = ['off', 'important', 'normal'] as const;

export type Theme = (typeof themeOptions)[number];
export type TextSize = (typeof textSizeOptions)[number];
export type MotionPreference = (typeof motionOptions)[number];
export type NarrationFrequency = (typeof narrationOptions)[number];

export interface SettingsSnapshot {
	theme: Theme;
	textSize: TextSize;
	motion: MotionPreference;
	narrationFrequency: NarrationFrequency;
	narratorVoice: boolean;
	scientificMode: boolean;
	keyboardShortcuts: boolean;
}

export const settingsStorageKey = 'hh:settings';
export const settingsSchemaVersion = 1;

export const defaultSettings: SettingsSnapshot = {
	theme: 'system',
	textSize: 'normal',
	motion: 'system',
	narrationFrequency: 'normal',
	narratorVoice: false,
	scientificMode: false,
	keyboardShortcuts: true
};

export function pickOption<T extends string>(
	value: unknown,
	options: readonly T[],
	fallback: T
): T {
	return options.find((option) => option === value) ?? fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

export function parseSettings(raw: unknown): SettingsSnapshot {
	if (typeof raw !== 'object' || raw === null) return { ...defaultSettings };
	const record: Record<string, unknown> = { ...raw };
	if (record['schemaVersion'] !== settingsSchemaVersion) return { ...defaultSettings };
	return {
		theme: pickOption(record['theme'], themeOptions, defaultSettings.theme),
		textSize: pickOption(record['textSize'], textSizeOptions, defaultSettings.textSize),
		motion: pickOption(record['motion'], motionOptions, defaultSettings.motion),
		narrationFrequency: pickOption(
			record['narrationFrequency'],
			narrationOptions,
			defaultSettings.narrationFrequency
		),
		narratorVoice: pickBoolean(record['narratorVoice'], defaultSettings.narratorVoice),
		scientificMode: pickBoolean(record['scientificMode'], defaultSettings.scientificMode),
		keyboardShortcuts: pickBoolean(record['keyboardShortcuts'], defaultSettings.keyboardShortcuts)
	};
}

export function resolveReducedMotion(
	preference: MotionPreference,
	systemPrefersReduced: boolean
): boolean {
	if (preference === 'reduced') return true;
	if (preference === 'full') return false;
	return systemPrefersReduced;
}

export function resolveTheme(preference: Theme, systemPrefersDark: boolean): 'light' | 'dark' {
	if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
	return preference;
}

export class Settings {
	theme = $state<Theme>(defaultSettings.theme);
	textSize = $state<TextSize>(defaultSettings.textSize);
	motion = $state<MotionPreference>(defaultSettings.motion);
	narrationFrequency = $state<NarrationFrequency>(defaultSettings.narrationFrequency);
	narratorVoice = $state(defaultSettings.narratorVoice);
	scientificMode = $state(defaultSettings.scientificMode);
	keyboardShortcuts = $state(defaultSettings.keyboardShortcuts);

	snapshot(): SettingsSnapshot {
		return {
			theme: this.theme,
			textSize: this.textSize,
			motion: this.motion,
			narrationFrequency: this.narrationFrequency,
			narratorVoice: this.narratorVoice,
			scientificMode: this.scientificMode,
			keyboardShortcuts: this.keyboardShortcuts
		};
	}

	adopt(snapshot: SettingsSnapshot): void {
		this.theme = snapshot.theme;
		this.textSize = snapshot.textSize;
		this.motion = snapshot.motion;
		this.narrationFrequency = snapshot.narrationFrequency;
		this.narratorVoice = snapshot.narratorVoice;
		this.scientificMode = snapshot.scientificMode;
		this.keyboardShortcuts = snapshot.keyboardShortcuts;
	}

	load(): void {
		if (!browser) return;
		try {
			const stored = window.localStorage.getItem(settingsStorageKey);
			if (stored === null) return;
			this.adopt(parseSettings(JSON.parse(stored)));
		} catch {
			this.adopt({ ...defaultSettings });
		}
	}

	save(): void {
		if (!browser) return;
		try {
			const payload = { schemaVersion: settingsSchemaVersion, ...this.snapshot() };
			window.localStorage.setItem(settingsStorageKey, JSON.stringify(payload));
		} catch {
			return;
		}
	}

	reset(): void {
		this.adopt({ ...defaultSettings });
		this.save();
	}
}

export const settings = new Settings();
