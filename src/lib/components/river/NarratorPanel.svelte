<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import { factById } from '$lib/content/facts';
	import { actionNames, lab, segmentLabel } from '$lib/content/lab';
	import { narration } from '$lib/content/narration';
	import { segmentIndices } from '$lib/sim';
	import { narrator } from '$lib/state/narrator.svelte';
	import { getSession, type Tool } from '$lib/state/simulation.svelte';
	import { getCamera } from '$lib/world/camera.svelte';

	interface Props {
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	const session = getSession();
	const camera = getCamera();
	const TYPING_MAX_MS = 1500;
	const TYPING_MS_PER_WORD = 60;
	const TYPING_TICK_MS = 50;

	let shownWords = $state(Number.POSITIVE_INFINITY);

	const current = $derived(narrator.entries[0] ?? null);
	const older = $derived(narrator.entries.slice(1));
	const words = $derived(current === null ? [] : current.text.split(' '));
	const displayText = $derived(words.slice(0, shownWords).join(' '));
	const fact = $derived(current?.factId ? factById(current.factId) : null);
	const suggestedTool = $derived<Tool | null>(
		current?.suggestedAction ? { type: current.suggestedAction } : null
	);
	const focusSegment = $derived(
		segmentIndices.find((index) => current?.highlightSegments.includes(index)) ?? null
	);
	const sourceLabel = $derived(
		current?.source === 'ai' ? narration.sourceAi : narration.sourceTemplate
	);

	$effect(() => {
		const entry = current;
		if (entry === null) return;
		const total = entry.text.split(' ').length;
		if (document.documentElement.dataset['motion'] === 'reduced') {
			shownWords = total;
			return;
		}
		shownWords = 0;
		const duration = Math.min(TYPING_MAX_MS, total * TYPING_MS_PER_WORD);
		const perTick = Math.max(1, Math.ceil(total / (duration / TYPING_TICK_MS)));
		const timer = setInterval(() => {
			shownWords = Math.min(total, shownWords + perTick);
			if (shownWords >= total) clearInterval(timer);
		}, TYPING_TICK_MS);
		return () => clearInterval(timer);
	});
</script>

<div aria-busy={narrator.busy} class="flex flex-col gap-3">
	{#if narrator.busy}
		<p class="text-sm text-ink-muted">{narration.writing}</p>
	{/if}
	{#if current !== null}
		<div class="flex flex-wrap items-center gap-2 text-sm">
			<span
				class="rounded-[var(--radius-chip)] border-[1.5px] px-2 py-0.5 font-medium {current.source ===
				'ai'
					? 'border-accent/50 text-accent-ink'
					: 'border-ink/15 text-ink-muted'}"
			>
				{sourceLabel}
			</span>
			<span class="text-ink-muted">{narration.monthPrefix} {current.month}</span>
		</div>
		<p>{displayText}</p>
		{#if suggestedTool !== null || (camera !== null && focusSegment !== null)}
			<div class="flex flex-wrap gap-2">
				{#if suggestedTool !== null}
					<Button
						variant="secondary"
						size="sm"
						onclick={() => (session.selectedTool = suggestedTool)}
					>
						{narration.pickTool}: {actionNames[suggestedTool.type]}
					</Button>
				{/if}
				{#if camera !== null && focusSegment !== null}
					<Button
						variant="secondary"
						size="sm"
						onclick={() => {
							session.focusedSegment = focusSegment;
							void camera.flyToSegment(focusSegment);
						}}
					>
						{lab.showOnWorld}: {segmentLabel(focusSegment)}
					</Button>
				{/if}
			</div>
		{/if}
		{#if fact !== null && !compact}
			<p class="rounded-[var(--radius-control)] bg-surface-2 px-3 py-2 text-sm">
				<strong>{narration.factLabel}</strong>
				{fact.text}
			</p>
		{/if}
	{:else}
		<p class="text-sm text-ink-muted">{narration.empty}</p>
	{/if}
	{#if older.length > 0 && !compact}
		<Disclosure summary={narration.history}>
			<ol class="flex flex-col gap-2 text-sm">
				{#each older as entry (entry.id)}
					<li>
						<span class="text-ink-muted">{narration.monthPrefix} {entry.month}:</span>
						{entry.text}
					</li>
				{/each}
			</ol>
		</Disclosure>
	{/if}
</div>
