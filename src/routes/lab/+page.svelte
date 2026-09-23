<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import StatusIcon from '$lib/components/hud/art/StatusIcon.svelte';
	import WoodPlank from '$lib/components/hud/art/WoodPlank.svelte';
	import WorldArt from '$lib/components/world/art/WorldArt.svelte';
	import WorldPreview from '$lib/components/world/WorldPreview.svelte';
	import {
		indicatorNames,
		labPresetIds,
		labRouteIdOf,
		picker,
		presetCards,
		presetNames,
		scenarioLevelNames,
		type LabPresetId
	} from '$lib/content/lab';
	import { formatScore } from '$lib/format/number';
	import { createInitialState, scenarioById, type SimState } from '$lib/sim';
	import { readLabSession, replayLabSession } from '$lib/state/labStorage';
	import { shell } from '$lib/state/shell.svelte';
	import { applyPending, DEFAULT_SEED } from '$lib/state/simulation.svelte';

	interface Saved {
		month: number;
		state: SimState;
	}

	const meterKeys = ['waterQuality', 'fish', 'floodRisk'] as const;
	const outOfText = ` ${picker.outOf}`;

	const cards = labPresetIds.map((id) => {
		const scenario = scenarioById(id);
		if (scenario === null) throw new Error(`scenario ${id} missing`);
		return {
			id,
			scenario,
			initial: createInitialState(scenario, DEFAULT_SEED)
		};
	});

	let saved = $state.raw<Partial<Record<LabPresetId, Saved>>>({});

	$effect(() => {
		const found: Partial<Record<LabPresetId, Saved>> = {};
		for (const card of cards) {
			const stored = readLabSession(card.id);
			if (stored.status !== 'ok') continue;
			try {
				const replayed = replayLabSession(card.scenario, stored.session);
				const last = replayed.snapshots[replayed.snapshots.length - 1];
				if (last === undefined) continue;
				found[card.id] = {
					month: stored.session.month,
					state: applyPending(last, replayed.pending)
				};
			} catch {
				continue;
			}
		}
		saved = found;
	});

	$effect(() => {
		const preset = labRouteIdOf(page.url.searchParams.get('preset'));
		if (preset === null) return;
		void goto(resolve('/lab/[skenario]', { skenario: preset }), { replaceState: true });
	});

	$effect(() => {
		shell.fullWidth = true;
		return () => {
			shell.fullWidth = false;
		};
	});
</script>

<svelte:head>
	<title>{picker.pageTitle}</title>
	<meta name="description" content={picker.lead} />
</svelte:head>

<WorldArt />

<WoodPlank class="mb-4 inline-block">
	<h1 class="text-2xl sm:text-3xl">{picker.title}</h1>
</WoodPlank>
<p class="mb-8 max-w-[var(--measure-prose)] text-ink-muted">{picker.lead}</p>

<ul class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
	{#each cards as card (card.id)}
		{@const info = presetCards[card.id]}
		{@const stored = saved[card.id]}
		<li class="scenario-card paper relative flex flex-col">
			<div class="scenario-preview overflow-hidden rounded-t-[11px] border-b-2 border-paper-edge">
				<WorldPreview state={stored?.state ?? card.initial} />
			</div>
			<div class="flex flex-1 flex-col gap-3 p-4">
				<h2 class="text-xl">
					<a href={resolve('/lab/[skenario]', { skenario: card.id })} class="scenario-link"
						>{presetNames[card.id]}</a
					>
				</h2>
				{#if stored !== undefined}
					<p
						class="w-fit rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5 text-sm font-semibold"
					>
						{picker.saved(stored.month)}
					</p>
				{/if}
				<p>{info.story}</p>
				<p class="text-sm">
					<span class="font-semibold">{picker.level}:</span>
					{scenarioLevelNames[info.level]}
				</p>
				<div class="mt-auto">
					<p class="mb-1.5 text-sm font-semibold">{picker.initial}</p>
					<ul class="flex flex-col gap-1.5 text-sm">
						{#each meterKeys as key (key)}
							{@const value = card.initial.indicators[key]}
							<li class="flex items-center gap-2">
								<StatusIcon kind={key} size={20} />
								<span class="min-w-0 flex-1">{indicatorNames[key]}</span>
								<span class="mini-track" aria-hidden="true">
									<span
										class="block h-full"
										style:width="{Math.max(0, Math.min(100, value))}%"
										style:background-color="var(--color-meter-{key})"
									></span>
								</span>
								<span data-numeric class="min-w-7 text-right font-bold"
									>{formatScore(value)}<span class="sr-only">{outOfText}</span></span
								>
							</li>
						{/each}
					</ul>
				</div>
			</div>
		</li>
	{/each}
</ul>

<style>
	.scenario-card {
		transition:
			transform var(--dur-base) var(--ease-out),
			border-color var(--dur-base) var(--ease-out);
	}

	.scenario-preview :global(svg) {
		transition: transform var(--dur-base) var(--ease-out);
	}

	.scenario-card:hover,
	.scenario-card:focus-within {
		transform: translateY(-4px);
		border-color: var(--color-primary);
	}

	.scenario-card:hover .scenario-preview :global(svg),
	.scenario-card:focus-within .scenario-preview :global(svg) {
		transform: scale(1.03);
	}

	.scenario-link::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.scenario-link:focus-visible {
		outline: none;
		box-shadow: none;
	}

	.scenario-link:focus-visible::after {
		outline: 3px solid var(--color-focus);
		outline-offset: 2px;
		box-shadow: 0 0 0 5px var(--color-focus-halo);
	}

	.mini-track {
		display: inline-block;
		width: 3.5rem;
		height: 0.625rem;
		overflow: hidden;
		background: var(--color-wood-dark);
		border: 2px solid var(--color-outline);
		border-radius: 9999px;
	}

	:global(:root[data-motion='reduced']) .scenario-card:hover,
	:global(:root[data-motion='reduced']) .scenario-card:focus-within {
		transform: none;
	}

	:global(:root[data-motion='reduced']) .scenario-card:hover .scenario-preview :global(svg),
	:global(:root[data-motion='reduced']) .scenario-card:focus-within .scenario-preview :global(svg) {
		transform: none;
	}

	@media (prefers-reduced-motion: reduce) {
		:global(:root:not([data-motion='full'])) .scenario-card:hover,
		:global(:root:not([data-motion='full'])) .scenario-card:focus-within,
		:global(:root:not([data-motion='full'])) .scenario-card:hover .scenario-preview :global(svg),
		:global(:root:not([data-motion='full']))
			.scenario-card:focus-within
			.scenario-preview
			:global(svg) {
			transform: none;
		}
	}
</style>
