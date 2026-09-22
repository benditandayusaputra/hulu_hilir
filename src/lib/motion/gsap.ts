import type { gsap as GsapNamespace } from 'gsap';

export type GsapApi = typeof GsapNamespace;

let corePromise: Promise<GsapApi> | null = null;
let scrollTriggerPromise: Promise<GsapApi> | null = null;

export function loadGsap(): Promise<GsapApi> {
	corePromise ??= import('gsap').then((module) => module.gsap);
	return corePromise;
}

export function loadGsapWithScrollTrigger(): Promise<GsapApi> {
	scrollTriggerPromise ??= Promise.all([loadGsap(), import('gsap/ScrollTrigger')]).then(
		([gsap, plugin]) => {
			gsap.registerPlugin(plugin.ScrollTrigger);
			return gsap;
		}
	);
	return scrollTriggerPromise;
}
