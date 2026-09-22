<script lang="ts">
	import { eventNames, lab } from '$lib/content/lab';
	import { createMotionScope, type MotionScope } from '$lib/motion';
	import { segmentIndices } from '$lib/sim';
	import { settings } from '$lib/state/settings.svelte';
	import { getSession, type CellRef } from '$lib/state/simulation.svelte';
	import { nextCell } from './navigation';
	import RiverBackdrop from './RiverBackdrop.svelte';
	import RiverSprites from './RiverSprites.svelte';
	import SegmentRow from './SegmentRow.svelte';
	import WeatherOverlay from './WeatherOverlay.svelte';
	import { tileNameOf } from './visuals';

	interface Props {
		onactivate: (cell: CellRef) => void;
	}

	let { onactivate }: Props = $props();

	const session = getSession();
	const stageId = $props.id();
	const FLOOD_TWEEN_SECONDS = 0.6;

	let root = $state<HTMLDivElement | null>(null);
	let focused = $state<CellRef>({ segment: 1, column: 1 });
	let tabHidden = $state(false);
	let motion = $state.raw<MotionScope | null>(null);

	const paused = $derived(!session.playing || tabHidden);
	const rain = $derived(
		session.latest.events.some(
			(event) => event.type === 'heavy_rain' || event.type === 'extreme_rain'
		)
	);
	const extreme = $derived(session.latest.events.some((event) => event.type === 'extreme_rain'));
	const weatherText = $derived.by(() => {
		if (extreme) return eventNames.extreme_rain;
		if (rain) return eventNames.heavy_rain;
		if (session.latest.droughtActive) return eventNames.drought;
		return '';
	});
	const caption = $derived.by(() => {
		const tile = session.tileAt(focused);
		if (tile === null) return session.waterCellNameOf(focused.segment);
		return tileNameOf(tile, session.segmentAt(focused.segment).status);
	});

	function cellElementId(cell: CellRef): string {
		return `${stageId}-s${cell.segment}-c${cell.column}`;
	}

	export function focusCell(cell: CellRef): void {
		focused = cell;
		session.focusedSegment = cell.segment;
		document.getElementById(cellElementId(cell))?.focus();
	}

	function handleNavigate(event: KeyboardEvent, cell: CellRef): void {
		const next = nextCell(cell, event);
		if (next === null) return;
		event.preventDefault();
		focusCell(next);
	}

	function handleFocusCell(cell: CellRef): void {
		focused = cell;
		session.focusedSegment = cell.segment;
	}

	$effect(() => {
		const update = () => (tabHidden = document.hidden);
		document.addEventListener('visibilitychange', update);
		return () => document.removeEventListener('visibilitychange', update);
	});

	$effect(() => {
		const element = root;
		if (element === null) return;
		let cancelled = false;
		let cleanup = () => {};
		createMotionScope(element, settings.motion, (scope) => {
			motion = scope;
		}).then((revert) => {
			if (cancelled) revert();
			else cleanup = revert;
		});
		return () => {
			cancelled = true;
			motion = null;
			cleanup();
		};
	});

	$effect(() => {
		const scope = motion;
		const element = root;
		const month = session.month;
		if (scope === null || element === null || month < 0) return;
		const overlays = element.querySelectorAll<SVGRectElement>('[data-flood-level]');
		scope.context.add(() => {
			for (const overlay of overlays) {
				const scaleY = Number(overlay.dataset['floodLevel'] ?? '0');
				if (scope.reducedMotion) {
					scope.gsap.set(overlay, { scaleY, transformOrigin: '50% 100%' });
				} else {
					scope.gsap.to(overlay, {
						scaleY,
						transformOrigin: '50% 100%',
						duration: FLOOD_TWEEN_SECONDS,
						ease: 'power2.out',
						overwrite: 'auto'
					});
				}
			}
		});
	});
</script>

<div
	bind:this={root}
	role="group"
	aria-label={lab.stageLabel}
	data-paused={paused ? '' : undefined}
	class="tile-grid relative flex flex-col gap-3 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-2 sm:p-3"
>
	<RiverSprites />
	<RiverBackdrop />
	<WeatherOverlay {rain} {extreme} drought={session.latest.droughtActive} />
	<div class="relative flex items-center justify-between gap-2 text-sm text-ink-muted">
		<span>{lab.upstream} ↓</span>
		{#if weatherText !== ''}
			<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5">{weatherText}</span>
		{/if}
		{#if session.enforcementActive}
			<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5"
				>{lab.enforcementActive}</span
			>
		{/if}
	</div>
	<div class="relative flex flex-col gap-3">
		{#each segmentIndices as index (index)}
			<SegmentRow
				{index}
				{focused}
				{cellElementId}
				{onactivate}
				onnavigate={handleNavigate}
				onfocuscell={handleFocusCell}
			/>
		{/each}
	</div>
	<div class="relative flex items-center justify-between gap-2 text-sm text-ink-muted">
		<span>{lab.downstream}</span>
	</div>
	<p aria-hidden="true" class="relative min-h-6 text-sm text-ink-muted">{caption}</p>
</div>
