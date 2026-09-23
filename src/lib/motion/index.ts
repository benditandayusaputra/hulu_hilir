export const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

export function systemPrefersReducedMotion(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
	return window.matchMedia(reducedMotionQuery).matches;
}
