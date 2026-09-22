<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Announcer from '$lib/components/ui/Announcer.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import SkipLink from '$lib/components/ui/SkipLink.svelte';
	import Toast from '$lib/components/ui/Toast.svelte';
	import { ui } from '$lib/content/ui';
	import { reducedMotionQuery } from '$lib/motion';
	import { watchMedia } from '$lib/state/media';
	import { resolveReducedMotion, resolveTheme, settings } from '$lib/state/settings.svelte';
	import { shell } from '$lib/state/shell.svelte';
	import HelpDialog from './HelpDialog.svelte';
	import SettingsDialog from './SettingsDialog.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const mainId = 'konten-utama';
	const darkSchemeQuery = '(prefers-color-scheme: dark)';
	const homeHref = resolve('/');
	const labHref = resolve('/lab');
	const linkClass =
		'rounded-[var(--radius-control)] px-3 py-2 font-medium aria-[current=page]:bg-surface-2';

	let settingsOpen = $state(false);
	let systemPrefersDark = $state(false);
	let systemPrefersReducedMotion = $state(false);

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
{#each shell.skipLinks as link (link.targetId)}
	<SkipLink targetId={link.targetId} label={link.label} />
{/each}
<Announcer />
<Toast />

<div class="flex min-h-dvh flex-col">
	<header class="border-b-[1.5px] border-ink/10 bg-surface">
		<div
			class="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 {shell.fullWidth
				? 'max-w-[88rem]'
				: 'max-w-6xl'}"
		>
			<a href={homeHref} class="font-display text-lg font-semibold">{ui.siteName}</a>
			<nav aria-label={ui.mainNavLabel} class="flex flex-wrap items-center gap-1 sm:gap-2">
				<a
					href={homeHref}
					aria-current={page.url.pathname === homeHref ? 'page' : undefined}
					class={linkClass}
				>
					{ui.home}
				</a>
				<a
					href={labHref}
					aria-current={page.url.pathname === labHref ? 'page' : undefined}
					class={linkClass}
				>
					{ui.lab}
				</a>
				<Button variant="secondary" size="sm" onclick={() => (settingsOpen = true)}>
					{ui.settings}
				</Button>
				<Button variant="secondary" size="sm" onclick={() => (shell.helpOpen = true)}>
					{ui.help}
				</Button>
			</nav>
		</div>
	</header>

	<main
		id={mainId}
		tabindex="-1"
		class="mx-auto w-full flex-1 px-4 py-8 {shell.fullWidth ? 'max-w-[88rem]' : 'max-w-6xl'}"
	>
		{@render children()}
	</main>

	<footer class="border-t-[1.5px] border-ink/10 bg-surface-2">
		<div
			class="mx-auto flex w-full flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-ink-muted {shell.fullWidth
				? 'max-w-[88rem]'
				: 'max-w-6xl'}"
		>
			<p>{ui.copyright}</p>
			<nav aria-label={ui.footerNavLabel}>
				<a href={homeHref} class="rounded-[var(--radius-control)] px-2 py-1">{ui.home}</a>
			</nav>
		</div>
	</footer>
</div>

<SettingsDialog bind:open={settingsOpen} />
<HelpDialog bind:open={shell.helpOpen} />
