import type { MotionPreference } from '$lib/state/settings.svelte';
import { loadGsap, type GsapApi } from './gsap';

export const reducedMotionQuery = '(prefers-reduced-motion: reduce)';
export const fullMotionQuery = '(prefers-reduced-motion: no-preference)';
export const anyMotionQuery = 'all';

export type GsapContext = ReturnType<GsapApi['context']>;

export interface MotionScope {
	gsap: GsapApi;
	context: GsapContext;
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

	const run = (reducedMotion: boolean) => {
		const context = gsap.context(() => {}, root);
		build({ gsap, context, reducedMotion });
		return () => context.revert();
	};

	if (preference === 'system') {
		media.add({ reduced: reducedMotionQuery, full: fullMotionQuery }, (context) =>
			run(context.conditions?.['reduced'] === true)
		);
	} else {
		media.add(anyMotionQuery, () => run(preference === 'reduced'));
	}

	return () => {
		media.revert();
	};
}
