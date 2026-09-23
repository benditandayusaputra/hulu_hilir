<script lang="ts">
	import Ban from '@lucide/svelte/icons/ban';
	import { tick } from 'svelte';
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
	const costSeparator = ', ';

	let panel = $state<HTMLElement | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);
	let sheetOpen = $state(true);
	let override = $state<string | null>(null);
	let footerHeight = $state(0);
	let footer = $state<HTMLDivElement | null>(null);

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
		options
			.reduce<{ name: string; items: Option[] }[]>((list, option) => {
				const found = list.find((group) => group.name === option.group);
				if (found) found.items.push(option);
				else list.push({ name: option.group, items: [option] });
				return list;
			}, [])
			.map((group) => ({
				name: group.name,
				items: [
					...group.items.filter((option) => option.preview.ok),
					...group.items.filter((option) => !option.preview.ok)
				]
			}))
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
		if (!ok) return;
		if (inline) onclose();
		else sheetOpen = false;
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
		const picked = override;
		if (picked === null) return;
		void tick().then(() => {
			const row = document.getElementById(`${baseId}-${picked}`)?.parentElement;
			if (row === null || row === undefined || footer === null) return;
			row.style.scrollMarginBottom = `${footer.offsetHeight + 8}px`;
			row.scrollIntoView({ block: 'nearest' });
		});
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

		<fieldset class="flex flex-col gap-3">
			<legend class="mb-1 font-medium">{lab.chooseAction}</legend>
			{#each groups as group (group.name)}
				<div class="flex flex-col gap-0.5">
					<span class="px-2 text-sm font-medium text-ink-muted">{group.name}</span>
					{#each group.items as option (option.id)}
						{@const id = `${baseId}-${option.id}`}
						<div
							class="flex items-start gap-2 rounded-[var(--radius-control)] px-2 py-1.5 has-[:checked]:bg-surface-2"
							style:scroll-margin-bottom="{footerHeight + 8}px"
						>
							<input
								{id}
								type="radio"
								name="{baseId}-action"
								value={option.id}
								checked={chosenId === option.id}
								onchange={() => (override = option.id)}
								aria-describedby={option.preview.ok ? undefined : `${id}-reason`}
								class="mt-1 size-4 shrink-0 accent-primary"
							/>
							<div class="flex min-w-0 flex-1 flex-col gap-0.5">
								<label
									for={id}
									class="flex cursor-pointer items-baseline justify-between gap-3 leading-snug {option
										.preview.ok
										? ''
										: 'text-ink-muted'}"
								>
									<span>{option.label}</span>
									{#if option.tool !== null && option.preview.cost > 0}
										<span data-numeric class="shrink-0 text-sm whitespace-nowrap text-ink-muted"
											><span class="sr-only">{costSeparator}</span>{formatBillions(
												option.preview.cost
											)}</span
										>
									{/if}
								</label>
								{#if !option.preview.ok}
									<span id="{id}-reason" class="flex items-start gap-1.5 text-sm text-ink-muted">
										<Ban size={14} aria-hidden="true" class="mt-0.5 shrink-0" />
										{option.preview.reason}
									</span>
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

		<div
			bind:this={footer}
			bind:offsetHeight={footerHeight}
			data-action-footer
			class="sticky -mx-4 -mb-4 flex flex-col gap-3 border-t-[1.5px] border-ink/10 bg-surface px-4 pt-3 pb-4 {inline
				? '-bottom-3.5'
				: '-bottom-4 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6 sm:pb-6'}"
		>
			{#if chosen !== null}
				<dl class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
					<div class="col-span-2">
						<dt class="text-ink-muted">{lab.effect}</dt>
						<dd>{chosen.tool !== null ? toolEffect(chosen.tool) : lab.dismantleGroup}</dd>
					</div>
					<div>
						<dt class="text-ink-muted">{lab.buildCost}</dt>
						<dd data-numeric class="font-semibold">
							{chosen.preview.cost === 0 ? lab.free : formatBillions(chosen.preview.cost)}
						</dd>
					</div>
					{#if chosen.tool !== null}
						<div>
							<dt class="text-ink-muted">{lab.upkeepCost}</dt>
							<dd data-numeric class="font-semibold">
								{toolUpkeep(chosen.tool) === 0
									? lab.free
									: `${formatBillions(toolUpkeep(chosen.tool))} ${lab.perMonth}`}
							</dd>
						</div>
						<div>
							<dt class="text-ink-muted">{lab.leadTime}</dt>
							<dd class="font-semibold">{leadText(chosen.tool)}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-ink-muted">{lab.cashAfter}</dt>
						<dd data-numeric class="font-semibold">
							{chosen.preview.cashAfter === null
								? lab.cashUnlimited
								: formatBillions(chosen.preview.cashAfter)}
						</dd>
					</div>
				</dl>
			{/if}
			<div class="flex flex-wrap items-start gap-2">
				<Button onclick={confirm} unavailableReason={confirmReason}>
					{chosen?.dismantle !== null && chosen !== null ? lab.dismantle : lab.install}
				</Button>
				{#if inline}
					<Button variant="secondary" onclick={onclose}>{lab.close}</Button>
				{/if}
			</div>
		</div>
	</div>
{/snippet}

{#if inline}
	<section
		bind:this={panel}
		aria-labelledby={titleId}
		class="wood wood-nails flex min-h-0 flex-col gap-2 overflow-y-auto px-3 pt-3 pb-3.5"
	>
		<h2
			id={titleId}
			bind:this={heading}
			tabindex="-1"
			class="px-3 text-lg leading-tight focus-visible:outline-offset-4"
		>
			{title}
		</h2>
		<div class="paper p-4">
			{@render body()}
		</div>
	</section>
{:else}
	<Sheet bind:open={sheetOpen} {title}>
		{@render body()}
	</Sheet>
{/if}
