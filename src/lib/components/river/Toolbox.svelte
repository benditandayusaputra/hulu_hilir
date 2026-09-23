<script lang="ts">
	import Undo2 from '@lucide/svelte/icons/undo-2';
	import HotbarSlot from '$lib/components/hud/art/HotbarSlot.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { actionErrorMessage, actionShortNames, lab } from '$lib/content/lab';
	import { formatBillions, formatBillionsShort } from '$lib/format/number';
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
	const showStrip = $derived(
		!compact || session.selectedTool !== null || session.pending.length > 0
	);

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
		return cost === 0 ? lab.free : formatBillionsShort(cost);
	}

	function unavailableReason(tool: Tool): string {
		const cash = session.state.cash;
		if (cash === null || cash >= toolCost(tool)) return '';
		return actionErrorMessage('insufficient_cash', toolName(tool), '');
	}
</script>

<div class="flex min-w-0 flex-col gap-1">
	{#if showStrip}
		<div class="paper flex flex-wrap items-start gap-x-3 gap-y-1 px-3 py-1.5 text-sm">
			<div class="flex min-h-9 min-w-0 flex-1 basis-56 flex-wrap items-center gap-x-3 gap-y-1">
				{#if session.selectedTool === null}
					<span class={compact ? 'sr-only' : 'text-ink-muted'}>{lab.toolHint}</span>
				{:else}
					<span>{lab.toolSelected}: <strong>{toolName(session.selectedTool)}</strong></span>
					<Button variant="ghost" size="sm" onclick={() => (session.selectedTool = null)}>
						{lab.releaseTool}
					</Button>
				{/if}
			</div>
			{#if !compact || session.pending.length > 0}
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
			{/if}
		</div>
	{:else}
		<span class="sr-only">{lab.toolHint}</span>
	{/if}
	<div class="flex gap-4 overflow-x-auto px-1 pt-2 pb-2">
		{#each toolGroups as group (group.id)}
			<fieldset class="flex shrink-0 flex-col">
				<legend class="mb-1 px-1 text-sm font-bold">{groupNames[group.id]}</legend>
				<div class="flex gap-2 pt-1.5">
					{#each group.tools as tool (toolId(tool))}
						{@const id = `${baseId}-${toolId(tool)}`}
						{@const reason = unavailableReason(tool)}
						{@const Icon = toolIcon(tool)}
						<HotbarSlot
							{id}
							name="{baseId}-{group.id}"
							value={toolId(tool)}
							checked={selectedId === toolId(tool)}
							label={toolName(tool)}
							shortLabel={tool.choice === undefined
								? (actionShortNames[tool.type] ?? toolName(tool))
								: toolName(tool)}
							cost={shortCost(tool)}
							reason={reason === '' ? '' : lab.cashShort}
							describedBy="{id}-detail"
							{compact}
							onchange={() => (session.selectedTool = tool)}
						>
							{#snippet icon()}<Icon size={compact ? 20 : 24} aria-hidden="true" />{/snippet}
						</HotbarSlot>
						<span id="{id}-detail" class="sr-only">
							{costText(tool)}. {toolEffect(tool)}
							{#if reason !== ''}{reason}{/if}
						</span>
					{/each}
				</div>
			</fieldset>
		{/each}
	</div>
</div>
