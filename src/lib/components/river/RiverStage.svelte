<script lang="ts">
	import { lab } from '$lib/content/lab';
	import { segmentIndices, type SegmentIndex } from '$lib/sim';
	import { getSession, type CellRef } from '$lib/state/simulation.svelte';
	import { nextCell } from './navigation';
	import SegmentRow from './SegmentRow.svelte';

	interface Props {
		compact?: boolean;
		inView?: readonly SegmentIndex[];
		onactivate: (cell: CellRef) => void;
		onfocuscell?: (cell: CellRef) => void;
	}

	let { compact = false, inView = [], onactivate, onfocuscell }: Props = $props();

	const session = getSession();
	const stageId = $props.id();

	let focused = $state<CellRef>({ segment: 1, column: 1 });

	const firstInView = $derived(inView.length === 0 ? null : Math.min(...inView));
	const lastInView = $derived(inView.length === 0 ? null : Math.max(...inView));

	function cellElementId(cell: CellRef): string {
		return `${stageId}-s${cell.segment}-c${cell.column}`;
	}

	export function focusCell(cell: CellRef): boolean {
		focused = cell;
		session.focusedSegment = cell.segment;
		const element = document.getElementById(cellElementId(cell));
		if (element === null || element.offsetParent === null) return false;
		element.focus();
		return true;
	}

	export function focusedCell(): CellRef {
		return focused;
	}

	export function markFocused(cell: CellRef): void {
		focused = cell;
		session.focusedSegment = cell.segment;
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
		onfocuscell?.(cell);
	}
</script>

<div
	role="group"
	aria-label={lab.stageLabel}
	class="tile-grid relative flex flex-col {compact ? 'tile-grid-compact gap-1' : 'gap-3'}"
>
	{#if compact && firstInView !== null && lastInView !== null}
		<span
			aria-hidden="true"
			class="camera-window pointer-events-none absolute -inset-x-1 rounded-[var(--radius-control)] border-[3px] border-primary"
			style:--first={firstInView - 1}
			style:--count={lastInView - firstInView + 1}
		></span>
	{/if}
	{#each segmentIndices as index (index)}
		<SegmentRow
			{index}
			{focused}
			{compact}
			{cellElementId}
			{onactivate}
			onnavigate={handleNavigate}
			onfocuscell={handleFocusCell}
		/>
	{/each}
</div>
