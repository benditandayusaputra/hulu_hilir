<script lang="ts">
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import Button from '$lib/components/ui/Button.svelte';
	import { actionErrorMessage, lab } from '$lib/content/lab';
	import { formatBillions } from '$lib/format/number';
	import {
		getSession,
		toolCost,
		toolEffect,
		toolGroups,
		toolId,
		toolName,
		toolUpkeep,
		type Tool,
		type ToolGroupId
	} from '$lib/state/simulation.svelte';
	import { toolIcon } from './toolIcons';

	interface Props {
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	const session = getSession();
	const baseId = $props.id();

	const groupNames: Record<ToolGroupId, string> = {
		land: lab.groupLand,
		tile: lab.groupTile,
		segment: lab.groupSegment,
		river: lab.groupRiver
	};

	const selectedId = $derived(session.selectedTool === null ? null : toolId(session.selectedTool));

	function costText(tool: Tool): string {
		const cost = toolCost(tool);
		const upkeep = toolUpkeep(tool);
		const build = cost === 0 ? lab.free : formatBillions(cost);
		const dense =
			tool.type === 'ipal_communal'
				? ` (${lab.denseVariant} ${formatBillions(toolCost(tool, 'dense_settlement'))})`
				: '';
		const routine = upkeep === 0 ? '' : `, ${formatBillions(upkeep)} ${lab.perMonth}`;
		return `${build}${dense}${routine}`;
	}

	function shortCost(tool: Tool): string {
		const cost = toolCost(tool);
		return cost === 0 ? lab.free : formatBillions(cost).replace(' miliar', ' M');
	}

	function unavailableReason(tool: Tool): string {
		const cash = session.state.cash;
		if (cash === null || cash >= toolCost(tool)) return '';
		return actionErrorMessage('insufficient_cash', toolName(tool), '');
	}
</script>

<div class="flex min-w-0 flex-col gap-2">
	<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm {compact ? '' : 'min-h-9'}">
		{#if session.selectedTool === null}
			<span class={compact ? 'sr-only' : 'text-ink-muted'}>{lab.toolHint}</span>
		{:else}
			<span>{lab.toolSelected}: <strong>{toolName(session.selectedTool)}</strong></span>
			<Button variant="ghost" size="sm" onclick={() => (session.selectedTool = null)}>
				{lab.releaseTool}
			</Button>
		{/if}
		{#if !compact || session.pending.length > 0}
			<span class="ml-auto">
				<Button
					variant="secondary"
					size="sm"
					onclick={() => session.undo()}
					unavailableReason={session.pending.length === 0 ? lab.undoNone : ''}
				>
					{#snippet icon()}
						<Undo2 size={18} />
					{/snippet}
					{lab.undo}
				</Button>
			</span>
		{/if}
	</div>
	<div class="hotbar flex gap-3 overflow-x-auto pb-1">
		{#each toolGroups as group (group.id)}
			<fieldset class="flex shrink-0 flex-col gap-1">
				<legend class="mb-1 px-1 text-sm font-medium text-ink-muted">{groupNames[group.id]}</legend>
				<div class="flex gap-1.5">
					{#each group.tools as tool (toolId(tool))}
						{@const id = `${baseId}-${toolId(tool)}`}
						{@const reason = unavailableReason(tool)}
						{@const Icon = toolIcon(tool)}
						<div class="relative">
							<input
								{id}
								type="radio"
								name="{baseId}-{group.id}"
								value={toolId(tool)}
								checked={selectedId === toolId(tool)}
								onchange={() => (session.selectedTool = tool)}
								aria-describedby="{id}-detail"
								class="peer absolute inset-0 size-full cursor-pointer appearance-none rounded-[var(--radius-control)]"
							/>
							<label
								for={id}
								data-unavailable={reason === '' ? undefined : ''}
								class="pointer-events-none flex h-full min-h-11 w-24 flex-col items-center gap-0.5 rounded-[var(--radius-control)] border-[1.5px] border-ink/15 bg-surface px-1.5 py-1.5 text-center text-sm leading-tight transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] peer-checked:-translate-y-1 peer-checked:border-primary peer-checked:bg-surface-2 peer-checked:ring-2 peer-checked:ring-primary data-unavailable:opacity-70"
							>
								<Icon size={22} aria-hidden="true" />
								<span class="font-medium">{toolName(tool)}</span>
								<span aria-hidden="true" class="text-ink-muted" data-numeric>{shortCost(tool)}</span
								>
							</label>
							<span id="{id}-detail" class="sr-only">
								{costText(tool)}. {toolEffect(tool)}
								{#if reason !== ''}{reason}{/if}
							</span>
						</div>
					{/each}
				</div>
			</fieldset>
		{/each}
	</div>
</div>
