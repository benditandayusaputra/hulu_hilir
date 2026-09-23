<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import OctagonAlert from '@lucide/svelte/icons/octagon-alert';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import StatusChip from '$lib/components/ui/StatusChip.svelte';
	import { actionNames, segmentLabel } from '$lib/content/lab';
	import type { SegmentIndex, WaterStatus } from '$lib/sim';
	import { cellColumns, getSession, sameCell, type CellRef } from '$lib/state/simulation.svelte';
	import BankTile from './BankTile.svelte';
	import { waterPatternId } from './visuals';

	interface Props {
		index: SegmentIndex;
		focused: CellRef;
		compact: boolean;
		cellElementId: (cell: CellRef) => string;
		onactivate: (cell: CellRef) => void;
		onnavigate: (event: KeyboardEvent, cell: CellRef) => void;
		onfocuscell: (cell: CellRef) => void;
	}

	let { index, focused, compact, cellElementId, onactivate, onnavigate, onfocuscell }: Props =
		$props();

	const session = getSession();
	const labelId = $props.id();

	const statusIcons: Record<WaterStatus, LucideIcon> = {
		good: CircleCheck,
		light: CircleAlert,
		moderate: TriangleAlert,
		heavy: OctagonAlert
	};

	const segment = $derived(session.segmentAt(index));
	const StatusIcon = $derived(statusIcons[segment.status]);
	const cells = $derived(cellColumns.map((column): CellRef => ({ segment: index, column })));
</script>

<div
	role="group"
	aria-labelledby={labelId}
	data-segment={index}
	class={compact ? 'grid grid-cols-[1.25rem_1fr] items-center gap-1' : 'flex flex-col gap-1'}
>
	{#if compact}
		<span aria-hidden="true" class="text-center text-sm font-bold">{index}</span>
		<span id={labelId} class="sr-only">{segmentLabel(index)}</span>
	{:else}
		<span id={labelId} class="text-sm font-medium">{segmentLabel(index)}</span>
	{/if}
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
					data-status={segment.status}
					onclick={() => onactivate(cell)}
					onkeydown={(event) => onnavigate(event, cell)}
					onfocus={() => onfocuscell(cell)}
					class="relative h-[var(--tile-size)] min-w-[var(--water-min)] overflow-hidden rounded-[var(--radius-control)] border-[1.5px] border-ink/10 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary"
				>
					<svg
						aria-hidden="true"
						viewBox="0 0 40 40"
						preserveAspectRatio="none"
						class="block size-full"
					>
						<rect width="40" height="40" style:fill="var(--color-water-{segment.status})" />
						<rect
							width="40"
							height="40"
							fill="url(#{waterPatternId(segment.status)})"
							class="text-ink"
							opacity="0.5"
						/>
					</svg>
					<span
						aria-hidden="true"
						class="absolute inset-0 m-auto grid size-6 place-items-center rounded-full bg-surface text-ink"
					>
						<StatusIcon size={16} />
					</span>
				</button>
			{/if}
		{/each}
	</div>
	{#if !compact}
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
	{/if}
</div>
