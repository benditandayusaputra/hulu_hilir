<script lang="ts">
	import VisuallyHidden from '$lib/components/ui/VisuallyHidden.svelte';
	import { toolReadyDescription } from '$lib/content/lab';
	import type { TileState, WaterStatus } from '$lib/sim';
	import { getSession, sameCell, toolName, type CellRef } from '$lib/state/simulation.svelte';
	import { badgeId, tileArtId, tileNameOf } from './visuals';

	interface Props {
		cell: CellRef;
		tile: TileState;
		status: WaterStatus;
		elementId: string;
		tabbable: boolean;
		onactivate: (cell: CellRef) => void;
		onnavigate: (event: KeyboardEvent, cell: CellRef) => void;
		onfocuscell: (cell: CellRef) => void;
	}

	let { cell, tile, status, elementId, tabbable, onactivate, onnavigate, onfocuscell }: Props =
		$props();

	const session = getSession();
	const descriptionId = $derived(`${elementId}-desc`);

	const name = $derived(tileNameOf(tile, status));
	const pressed = $derived(sameCell(session.selection, cell));
	const description = $derived.by(() => {
		const tool = session.selectedTool;
		if (tool === null) return '';
		const preview = session.previewTool(tool, cell);
		return preview.ok ? toolReadyDescription(toolName(tool), preview.cost) : preview.reason;
	});
</script>

<button
	type="button"
	id={elementId}
	aria-label={name}
	aria-pressed={pressed}
	aria-describedby={description === '' ? undefined : descriptionId}
	tabindex={tabbable ? 0 : -1}
	data-cell="{cell.segment}-{cell.column}"
	onclick={() => onactivate(cell)}
	onkeydown={(event) => onnavigate(event, cell)}
	onfocus={() => onfocuscell(cell)}
	class="relative aspect-square w-[var(--tile-size)] overflow-hidden rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface-2 transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:scale-[1.03] aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary"
>
	<svg viewBox="0 0 96 96" aria-hidden="true" class="block size-full">
		<use href="#{tileArtId(tile)}" />
	</svg>
	{#if tile.interventions.length > 0}
		<span aria-hidden="true" class="absolute right-1 bottom-1 flex gap-0.5">
			{#each tile.interventions as item (item.type)}
				<svg
					viewBox="0 0 24 24"
					class="size-5 rounded-full border-[1.5px] bg-surface p-0.5 text-ink {item.activeFrom >
					session.month
						? 'border-dashed border-ink/40 opacity-70'
						: 'border-ink/20'}"
				>
					<use href="#{badgeId(item.type)}" />
				</svg>
			{/each}
		</span>
	{/if}
</button>
{#if description !== ''}
	<VisuallyHidden><span id={descriptionId}>{description}</span></VisuallyHidden>
{/if}
