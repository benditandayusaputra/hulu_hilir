import type { WorldDetail } from '$lib/state/settings.svelte';

export type ResolvedDetail = 'light' | 'full';

export interface DeviceProbe {
	cores: number | null;
	memory: number | null;
	saveData: boolean;
	reducedMotion: boolean;
}

export const MIN_CORES = 4;
export const MIN_MEMORY_GB = 4;

export function resolveWorldDetail(preference: WorldDetail, probe: DeviceProbe): ResolvedDetail {
	if (preference !== 'auto') return preference;
	if (probe.saveData || probe.reducedMotion) return 'light';
	if (probe.cores !== null && probe.cores < MIN_CORES) return 'light';
	if (probe.memory !== null && probe.memory < MIN_MEMORY_GB) return 'light';
	return 'full';
}

function numberField(source: object, key: string): number | null {
	const value: unknown = Reflect.get(source, key);
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function probeDevice(): DeviceProbe {
	const connection: unknown = Reflect.get(navigator, 'connection');
	const saveData =
		typeof connection === 'object' &&
		connection !== null &&
		Reflect.get(connection, 'saveData') === true;
	return {
		cores: numberField(navigator, 'hardwareConcurrency'),
		memory: numberField(navigator, 'deviceMemory'),
		saveData,
		reducedMotion: document.documentElement.dataset['motion'] === 'reduced'
	};
}
