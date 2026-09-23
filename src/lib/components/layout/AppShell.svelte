<script lang="ts">
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Settings from '@lucide/svelte/icons/settings';
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
		'inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-2.5 font-semibold aria-[current=page]:bg-surface aria-[current=page]:text-ink aria-[current=page]:text-shadow-none max-sm:text-base sm:px-3';

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

<div class="flex flex-col {shell.immersive ? 'h-dvh' : 'min-h-dvh'}">
	<header class="wood relative z-10 rounded-none border-x-0 border-t-0">
		<div
			class="mx-auto flex w-full flex-wrap items-center justify-between gap-x-2 gap-y-1 px-3 py-1.5 sm:px-4 {shell.fullWidth ||
			shell.immersive
				? 'max-w-[88rem]'
				: 'max-w-6xl'}"
		>
			<a href={homeHref} class="plank-title text-base sm:text-xl">{ui.siteName}</a>
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
					aria-current={page.url.pathname === labHref || page.url.pathname.startsWith(`${labHref}/`)
						? 'page'
						: undefined}
					class={linkClass}
				>
					{ui.lab}
				</a>
				<Button variant="secondary" size="sm" onclick={() => (settingsOpen = true)}>
					{#snippet icon()}<Settings size={18} />{/snippet}
					<span class="max-sm:sr-only">{ui.settings}</span>
				</Button>
				<Button variant="secondary" size="sm" onclick={() => (shell.helpOpen = true)}>
					{#snippet icon()}<CircleHelp size={18} />{/snippet}
					<span class="max-sm:sr-only">{ui.help}</span>
				</Button>
			</nav>
		</div>
	</header>

	<main
		id={mainId}
		tabindex="-1"
		class={shell.immersive
			? 'relative min-h-0 w-full flex-1'
			: `mx-auto w-full flex-1 px-4 py-8 ${shell.fullWidth ? 'max-w-[88rem]' : 'max-w-6xl'}`}
	>
		{@render children()}
	</main>

	<footer
		class="wood rounded-none border-x-0 border-b-0 text-sm {shell.immersive ? 'max-sm:hidden' : ''}"
	>
		<div
			class="mx-auto flex w-full flex-wrap items-center justify-between gap-x-4 px-4 {shell.immersive
				? 'py-1'
				: 'py-5'} {shell.fullWidth || shell.immersive ? 'max-w-[88rem]' : 'max-w-6xl'}"
		>
			<p>{ui.copyright}</p>
			<nav aria-label={ui.footerNavLabel}>
				<a
					href={homeHref}
					class="inline-flex min-h-6 items-center rounded-[var(--radius-control)] px-2 font-semibold"
					>{ui.home}</a
				>
			</nav>
		</div>
	</footer>
</div>

<SettingsDialog bind:open={settingsOpen} />
<HelpDialog bind:open={shell.helpOpen} />
