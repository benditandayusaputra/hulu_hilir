<script lang="ts">
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

	function unavailableReason(tool: Tool): string {
		const cash = session.state.cash;
		if (cash === null || cash >= toolCost(tool)) return '';
		return actionErrorMessage('insufficient_cash', toolName(tool), '');
	}
</script>

<div class="flex flex-col gap-3">
	<p class="text-sm text-ink-muted">{lab.toolHint}</p>
	<div class="flex min-h-9 flex-wrap items-center justify-between gap-2 text-sm">
		{#if session.selectedTool === null}
			<span>{lab.noTool}</span>
		{:else}
			<span>{lab.toolSelected}: <strong>{toolName(session.selectedTool)}</strong></span>
			<Button variant="ghost" size="sm" onclick={() => (session.selectedTool = null)}>
				{lab.releaseTool}
			</Button>
		{/if}
	</div>
	{#each toolGroups as group (group.id)}
		<fieldset class="rounded-[var(--radius-control)] border-[1.5px] border-ink/10 px-2 pt-1 pb-2">
			<legend class="px-1 text-sm font-medium">{groupNames[group.id]}</legend>
			<div class="flex flex-col gap-1">
				{#each group.tools as tool (toolId(tool))}
					{@const id = `${baseId}-${toolId(tool)}`}
					{@const reason = unavailableReason(tool)}
					<div
						class="flex items-start gap-2 rounded-[var(--radius-control)] px-2 py-1.5 has-[:checked]:bg-surface-2"
					>
						<input
							{id}
							type="radio"
							name="{baseId}-{group.id}"
							value={toolId(tool)}
							checked={selectedId === toolId(tool)}
							onchange={() => (session.selectedTool = tool)}
							aria-describedby="{id}-detail"
							class="mt-1.5 size-4 shrink-0 accent-primary"
						/>
						<div class="flex flex-col">
							<label for={id} class="cursor-pointer font-medium">{toolName(tool)}</label>
							<span id="{id}-detail" class="text-sm text-ink-muted">
								{costText(tool)}. {toolEffect(tool)}
								{#if reason !== ''}<span class="text-danger"> {reason}</span>{/if}
							</span>
						</div>
					</div>
				{/each}
			</div>
		</fieldset>
	{/each}
</div>
