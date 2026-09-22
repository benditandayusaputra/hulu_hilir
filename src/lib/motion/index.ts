import type { MotionPreference } from '$lib/state/settings.svelte';
import { loadGsap, type GsapApi } from './gsap';

export const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
export const fullMotionQuery = '(prefers-reduced-motion: no-preference)';
export const anyMotionQuery = 'all';

export interface MotionScope {
	gsap: GsapApi;
	reducedMotion: boolean;
}

export type MotionBuilder = (scope: MotionScope) => void;

export function systemPrefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
	return window.matchMedia(reducedMotionQuery).matches;
}

export async function createMotionScope(
	root: HTMLElement,
	preference: MotionPreference,
	build: MotionBuilder
): Promise<() => void> {
	const gsap = await loadGsap();
	const media = gsap.matchMedia(root);

	if (preference === 'system') {
		media.add({ reduced: reducedMotionQuery, full: fullMotionQuery }, (context) => {
			build({ gsap, reducedMotion: context.conditions?.['reduced'] === true });
		});
	} else {
		media.add(anyMotionQuery, () => {
			build({ gsap, reducedMotion: preference === 'reduced' });
		});
	}

	return () => {
		media.revert();
	};
}
