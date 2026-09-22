export const phoneQuery = '(max-width: 639px)';
export const desktopQuery = '(min-width: 1024px)';

export type Viewport = 'phone' | 'tablet' | 'desktop';

export function watchMedia(query: string, apply: (matches: boolean) => void): () => void {
	const media = window.matchMedia(query);
	apply(media.matches);
	const listener = (event: MediaQueryListEvent) => apply(event.matches);
	media.addEventListener('change', listener);
	return () => media.removeEventListener('change', listener);
}

export function viewportOf(phone: boolean, desktop: boolean): Viewport {
	if (phone) return 'phone';
	if (desktop) return 'desktop';
	return 'tablet';
}
