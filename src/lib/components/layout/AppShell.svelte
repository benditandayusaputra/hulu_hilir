<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import Announcer from '$lib/components/ui/Announcer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SkipLink from '$lib/components/ui/SkipLink.svelte';
	import { ui } from '$lib/content/ui';
	import { reducedMotionQuery } from '$lib/motion';
	import { resolveReducedMotion, resolveTheme, settings } from '$lib/state/settings.svelte';
	import SettingsDialog from './SettingsDialog.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const mainId = 'konten-utama';
	const homeHref = resolve('/');
	const darkSchemeQuery = '(prefers-color-scheme: dark)';

	let settingsOpen = $state(false);
	let systemPrefersDark = $state(false);
	let systemPrefersReducedMotion = $state(false);

	function watchMedia(query: string, apply: (matches: boolean) => void): () => void {
		const media = window.matchMedia(query);
		apply(media.matches);
		const listener = (event: MediaQueryListEvent) => apply(event.matches);
		media.addEventListener('change', listener);
		return () => media.removeEventListener('change', listener);
	}

	$effect(() => {
		settings.load();
		const stopDark = watchMedia(darkSchemeQuery, (matches) => (systemPrefersDark = matches));
		const stopMotion = watchMedia(
			reducedMotionQuery,
			(matches) => (systemPrefersReducedMotion = matches)
		);
		return () => {
			stopDark();
			stopMotion();
		};
	});

	$effect(() => {
		const root = document.documentElement;
		root.dataset['theme'] = resolveTheme(settings.theme, systemPrefersDark);
		root.dataset['textSize'] = settings.textSize;
		root.dataset['motion'] = resolveReducedMotion(settings.motion, systemPrefersReducedMotion)
			? 'reduced'
			: 'full';
	});
</script>

<SkipLink targetId={mainId} label={ui.skipToContent} />
<Announcer />

<div class="flex min-h-dvh flex-col">
	<header class="border-b-[1.5px] border-ink/10 bg-surface">
		<div class="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
			<a href={homeHref} class="font-display text-lg font-semibold">{ui.siteName}</a>
			<nav aria-label={ui.mainNavLabel} class="flex items-center gap-2">
				<a href={homeHref} class="rounded-[var(--radius-control)] px-3 py-2 font-medium"
					>{ui.home}</a
				>
				<Button variant="secondary" size="sm" onclick={() => (settingsOpen = true)}>
					{ui.settings}
				</Button>
			</nav>
		</div>
	</header>

	<main id={mainId} tabindex="-1" class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
		{@render children()}
	</main>

	<footer class="border-t-[1.5px] border-ink/10 bg-surface-2">
		<div
			class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-ink-muted"
		>
			<p>{ui.copyright}</p>
			<nav aria-label={ui.footerNavLabel}>
				<a href={homeHref} class="rounded-[var(--radius-control)] px-2 py-1">{ui.home}</a>
			</nav>
		</div>
	</footer>
</div>

<SettingsDialog bind:open={settingsOpen} />
