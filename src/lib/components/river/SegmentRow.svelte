<script lang="ts">
	import StatusChip from '$lib/components/ui/StatusChip.svelte';
	import { actionNames, segmentLabel } from '$lib/content/lab';
	import type { SegmentIndex } from '$lib/sim';
	import { cellColumns, getSession, sameCell, type CellRef } from '$lib/state/simulation.svelte';
	import BankTile from './BankTile.svelte';
	import WaterStrip from './WaterStrip.svelte';

	interface Props {
		index: SegmentIndex;
		focused: CellRef;
		cellElementId: (cell: CellRef) => string;
		onactivate: (cell: CellRef) => void;
		onnavigate: (event: KeyboardEvent, cell: CellRef) => void;
		onfocuscell: (cell: CellRef) => void;
	}

	let { index, focused, cellElementId, onactivate, onnavigate, onfocuscell }: Props = $props();

	const session = getSession();
	const labelId = $props.id();

	const segment = $derived(session.segmentAt(index));
	const cells = $derived(cellColumns.map((column): CellRef => ({ segment: index, column })));
</script>

<div role="group" aria-labelledby={labelId} data-segment={index} class="flex flex-col gap-1">
	<span id={labelId} class="text-sm font-medium">{segmentLabel(index)}</span>
	<div
		class="grid grid-cols-[var(--tile-size)_var(--tile-size)_minmax(var(--water-min),1fr)_var(--tile-size)_var(--tile-size)] gap-1"
	>
		{#each cells as cell (cell.column)}
			{@const tile = session.tileAt(cell)}
			{#if tile !== null}
				<BankTile
					{cell}
					{tile}
					status={segment.status}
					elementId={cellElementId(cell)}
					tabbable={sameCell(focused, cell)}
					{onactivate}
					{onnavigate}
					{onfocuscell}
				/>
			{:else}
				<button
					type="button"
					id={cellElementId(cell)}
					aria-label={session.waterCellNameOf(index)}
					aria-pressed={sameCell(session.selection, cell)}
					tabindex={sameCell(focused, cell) ? 0 : -1}
					data-cell="{cell.segment}-{cell.column}"
					onclick={() => onactivate(cell)}
					onkeydown={(event) => onnavigate(event, cell)}
					onfocus={() => onfocuscell(cell)}
					class="h-[var(--tile-size)] min-w-[var(--water-min)] rounded-[var(--radius-control)] border-[1.5px] border-ink/10 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary"
				>
					<WaterStrip {segment} />
				</button>
			{/if}
		{/each}
	</div>
	<div class="flex flex-wrap items-center gap-1">
		<StatusChip status={segment.status} />
		{#if segment.floodStatus !== 'safe'}
			<StatusChip status={segment.floodStatus} />
		{/if}
		{#each segment.interventions as item (item.type)}
			<span
				class="rounded-[var(--radius-chip)] border-[1.5px] border-leaf/40 bg-surface px-2 py-0.5 text-sm {item.activeFrom >
				session.month
					? 'border-dashed'
					: ''}"
			>
				{actionNames[item.type]}
			</span>
		{/each}
	</div>
</div>
