<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import StatusChip from '$lib/components/ui/StatusChip.svelte';
	import { actionNames, lab, segmentLabel, sideNames } from '$lib/content/lab';
	import { formatBillions, formatNumber } from '$lib/format/number';
	import type { InterventionType, Intervention } from '$lib/sim';
	import {
		getSession,
		toolEffect,
		toolGroups,
		toolId,
		toolLeadMonths,
		toolName,
		toolUpkeep,
		type ActionPreview,
		type CellRef,
		type Tool
	} from '$lib/state/simulation.svelte';
	import { tileLabelOf, tileSideKeyOf, tileStageOf } from './visuals';

	interface Props {
		cell: CellRef;
		inline: boolean;
		onclose: () => void;
	}

	let { cell, inline, onclose }: Props = $props();

	interface Option {
		id: string;
		label: string;
		group: string;
		tool: Tool | null;
		dismantle: InterventionType | null;
		preview: ActionPreview;
	}

	const session = getSession();
	const baseId = $props.id();
	const titleId = `${baseId}-title`;

	let panel = $state<HTMLElement | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);
	let sheetOpen = $state(true);
	let override = $state<string | null>(null);

	const tile = $derived(session.tileAt(cell));
	const segment = $derived(session.segmentAt(cell.segment));
	const title = $derived(
		tile === null
			? `${segmentLabel(cell.segment)}, ${lab.waterCell}`
			: `${segmentLabel(cell.segment)}, ${sideNames[tileSideKeyOf(tile)]}`
	);

	function toolsOf(groupId: string): readonly Tool[] {
		return toolGroups.find((group) => group.id === groupId)?.tools ?? [];
	}

	function toolOption(tool: Tool, group: string): Option {
		return {
			id: toolId(tool),
			label: toolName(tool),
			group,
			tool,
			dismantle: null,
			preview: session.previewTool(tool, cell)
		};
	}

	function dismantleOption(item: Intervention): Option {
		return {
			id: `dismantle:${item.type}`,
			label: actionNames[item.type],
			group: lab.dismantleGroup,
			tool: null,
			dismantle: item.type,
			preview: session.previewDismantle(cell, item.type)
		};
	}

	const options = $derived.by((): Option[] => {
		if (tile !== null) {
			const current = tile;
			return [
				...toolsOf('land')
					.filter((tool) => tool.choice !== current.landUse)
					.map((tool) => toolOption(tool, lab.landChange)),
				...toolsOf('tile').map((tool) => toolOption(tool, lab.tileInterventions)),
				...current.interventions.map(dismantleOption)
			];
		}
		return [
			...toolsOf('segment').map((tool) => toolOption(tool, lab.segmentInterventions)),
			...toolsOf('river').map((tool) => toolOption(tool, lab.riverPolicy)),
			...segment.interventions.map(dismantleOption),
			...session.state.riverInterventions.map(dismantleOption)
		];
	});

	const groups = $derived(
		options.reduce<{ name: string; items: Option[] }[]>((list, option) => {
			const found = list.find((group) => group.name === option.group);
			if (found) found.items.push(option);
			else list.push({ name: option.group, items: [option] });
			return list;
		}, [])
	);

	const defaultChoice = $derived.by(() => {
		const tool = session.selectedTool;
		if (tool === null) return null;
		return options.find((option) => option.id === toolId(tool))?.id ?? null;
	});
	const chosenId = $derived(override ?? defaultChoice);
	const chosen = $derived(options.find((option) => option.id === chosenId) ?? null);
	const confirmReason = $derived(
		chosen === null ? lab.chooseFirst : chosen.preview.ok ? '' : chosen.preview.reason
	);

	function interventionTiming(item: Intervention): string {
		return item.activeFrom <= session.month
			? `${lab.activeSince} ${item.activeFrom}`
			: `${lab.activeFrom} ${item.activeFrom}`;
	}

	function leadText(tool: Tool): string {
		const lead = toolLeadMonths(tool);
		return lead === 0 ? lab.immediate : `${lead} ${lab.monthsAfter}`;
	}

	function confirm(): void {
		if (chosen === null) return;
		const ok =
			chosen.tool !== null
				? session.install(chosen.tool, cell)
				: chosen.dismantle !== null
					? session.removeIntervention(cell, chosen.dismantle)
					: false;
		if (ok) onclose();
	}

	function handleWindowKey(event: KeyboardEvent): void {
		if (!inline || event.key !== 'Escape') return;
		const target = event.target;
		if (!(target instanceof Node) || panel === null || !panel.contains(target)) return;
		event.preventDefault();
		onclose();
	}

	$effect(() => {
		if (inline) heading?.focus();
	});

	$effect(() => {
		if (!inline && !sheetOpen) onclose();
	});
</script>

<svelte:window onkeydown={handleWindowKey} />

{#snippet body()}
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1 text-sm">
			<span class="font-medium">{lab.currentState}</span>
			{#if tile !== null}
				<span>
					{tileLabelOf(tile)}{#if tileStageOf(tile) !== null}, tahap {tileStageOf(tile)}{/if}
				</span>
				{#each tile.interventions as item (item.type)}
					<span class="text-ink-muted">
						{actionNames[item.type]}, {interventionTiming(item)}
					</span>
				{/each}
			{:else}
				<span class="flex flex-wrap items-center gap-1">
					<StatusChip status={segment.status} />
					<StatusChip status={segment.floodStatus} />
				</span>
				<span data-numeric>
					{lab.pollutionIndex}: {formatNumber(segment.pollutionIndex, 1)}
				</span>
				{#each segment.interventions as item (item.type)}
					<span class="text-ink-muted">
						{actionNames[item.type]}, {interventionTiming(item)}
					</span>
				{/each}
			{/if}
		</div>

		<fieldset class="flex flex-col gap-2">
			<legend class="mb-1 font-medium">{lab.chooseAction}</legend>
			{#each groups as group (group.name)}
				<div class="flex flex-col gap-1">
					<span class="text-sm font-medium text-ink-muted">{group.name}</span>
					{#each group.items as option (option.id)}
						{@const id = `${baseId}-${option.id}`}
						<div
							class="flex items-start gap-2 rounded-[var(--radius-control)] px-2 py-1 has-[:checked]:bg-surface-2"
						>
							<input
								{id}
								type="radio"
								name="{baseId}-action"
								value={option.id}
								checked={chosenId === option.id}
								onchange={() => (override = option.id)}
								aria-describedby={option.preview.ok ? undefined : `${id}-reason`}
								class="mt-1.5 size-4 shrink-0 accent-primary"
							/>
							<div class="flex flex-col">
								<label for={id} class="cursor-pointer">
									{option.label}
									{#if option.tool !== null && option.preview.cost > 0}
										<span class="text-sm text-ink-muted">
											({formatBillions(option.preview.cost)})
										</span>
									{/if}
								</label>
								{#if !option.preview.ok}
									<span id="{id}-reason" class="text-sm text-danger">{option.preview.reason}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/each}
			{#if options.length === 0}
				<p class="text-sm text-ink-muted">{lab.nothingAvailable}</p>
			{/if}
		</fieldset>

		{#if chosen !== null}
			<dl
				class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-[var(--radius-control)] bg-surface-2 p-3 text-sm"
			>
				<dt class="font-medium">{lab.effect}</dt>
				<dd>{chosen.tool !== null ? toolEffect(chosen.tool) : lab.dismantleGroup}</dd>
				<dt class="font-medium">{lab.buildCost}</dt>
				<dd data-numeric>
					{chosen.preview.cost === 0 ? lab.free : formatBillions(chosen.preview.cost)}
				</dd>
				{#if chosen.tool !== null}
					<dt class="font-medium">{lab.upkeepCost}</dt>
					<dd data-numeric>
						{toolUpkeep(chosen.tool) === 0
							? lab.free
							: `${formatBillions(toolUpkeep(chosen.tool))} ${lab.perMonth}`}
					</dd>
					<dt class="font-medium">{lab.leadTime}</dt>
					<dd>{leadText(chosen.tool)}</dd>
				{/if}
				<dt class="font-medium">{lab.cashAfter}</dt>
				<dd data-numeric>
					{chosen.preview.cashAfter === null
						? lab.cashUnlimited
						: formatBillions(chosen.preview.cashAfter)}
				</dd>
			</dl>
		{/if}

		<div class="flex flex-wrap gap-2">
			<Button onclick={confirm} unavailableReason={confirmReason}>
				{chosen?.dismantle !== null && chosen !== null ? lab.dismantle : lab.install}
			</Button>
			<Button variant="secondary" onclick={onclose}>{lab.close}</Button>
		</div>
	</div>
{/snippet}

{#if inline}
	<section
		bind:this={panel}
		aria-labelledby={titleId}
		class="rounded-[var(--radius-card)] border-[1.5px] border-primary/40 bg-surface p-4"
	>
		<h2
			id={titleId}
			bind:this={heading}
			tabindex="-1"
			class="mb-3 text-lg focus-visible:outline-offset-4"
		>
			{title}
		</h2>
		{@render body()}
	</section>
{:else}
	<Sheet bind:open={sheetOpen} {title}>
		{@render body()}
	</Sheet>
{/if}
