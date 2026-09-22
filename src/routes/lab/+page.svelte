<script lang="ts">
	import { setContext, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import EventDialog from '$lib/components/river/EventDialog.svelte';
	import IndicatorPanel from '$lib/components/river/IndicatorPanel.svelte';
	import NarratorPanel from '$lib/components/river/NarratorPanel.svelte';
	import RiverStage from '$lib/components/river/RiverStage.svelte';
	import RiverTableView from '$lib/components/river/RiverTableView.svelte';
	import SegmentInspector from '$lib/components/river/SegmentInspector.svelte';
	import TileActionPanel from '$lib/components/river/TileActionPanel.svelte';
	import TimeControls from '$lib/components/river/TimeControls.svelte';
	import Toolbox from '$lib/components/river/Toolbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import {
		chartSummary,
		indicatorNames,
		lab,
		labPresetIds,
		presetNames,
		type LabPresetId
	} from '$lib/content/lab';
	import { narration } from '$lib/content/narration';
	import { scenarioById, type Indicators, type Scenario } from '$lib/sim';
	import { announcer } from '$lib/state/announcer.svelte';
	import { desktopQuery, phoneQuery, viewportOf, watchMedia } from '$lib/state/media';
	import { settings } from '$lib/state/settings.svelte';
	import { shell } from '$lib/state/shell.svelte';
	import {
		sessionKey,
		SimulationSession,
		speedOptions,
		type CellRef
	} from '$lib/state/simulation.svelte';

	const defaultPreset: LabPresetId = 'desa';
	const demoPreset = 'demo';
	type LabScenarioId = LabPresetId | typeof demoPreset;
	const stageSectionId = 'panggung-sungai';
	const timeSectionId = 'kontrol-waktu';
	const presetSelectId = 'pilihan-skenario';

	function presetOf(value: string | null): LabScenarioId {
		if (value === demoPreset) return demoPreset;
		return labPresetIds.find((id) => id === value) ?? defaultPreset;
	}

	function presetLabel(preset: LabScenarioId): string {
		return preset === demoPreset ? 'Demo' : presetNames[preset];
	}

	function scenarioOf(preset: LabScenarioId): Scenario {
		const scenario = scenarioById(preset);
		if (scenario === null) throw new Error(`preset ${preset} missing`);
		return scenario;
	}

	const session = new SimulationSession(scenarioOf(defaultPreset));
	setContext(sessionKey, session);

	let root = $state<HTMLDivElement | null>(null);
	let stage = $state<RiverStage | null>(null);
	let lastCell = $state<CellRef | null>(null);
	let pendingPreset = $state<LabScenarioId | null>(null);
	let confirmOpen = $state(false);
	let tableOpen = $state(false);
	const tableId = 'tabel-sungai';

	let phoneMatch = $state(false);
	let desktopMatch = $state(true);
	let toolsOpen = $state(false);
	let inspectorOpen = $state(false);
	let activeTab = $state('tools');
	const viewport = $derived(viewportOf(phoneMatch, desktopMatch));
	const inlinePanel = $derived(viewport === 'desktop');
	const panelTabs = [
		{ id: 'tools', label: lab.tabTools },
		{ id: 'narrator', label: narration.tabNarrator },
		{ id: 'indicators', label: lab.tabIndicators },
		{ id: 'inspector', label: lab.tabInspector }
	];

	$effect(() => {
		const stopPhone = watchMedia(phoneQuery, (matches) => (phoneMatch = matches));
		const stopDesktop = watchMedia(desktopQuery, (matches) => (desktopMatch = matches));
		return () => {
			stopPhone();
			stopDesktop();
		};
	});

	const chartKeys: readonly (keyof Indicators)[] = ['waterQuality', 'fish', 'floodRisk', 'economy'];
	const chartStyles = ['solid', 'dashed', 'dotted', 'dashdot'] as const;
	const chartSeries = $derived(
		chartKeys.map((key, order) => ({
			id: key,
			label: indicatorNames[key],
			values: session.indicatorHistory.map((item) => item[key]),
			style: chartStyles[order] ?? 'solid'
		}))
	);
	const chartText = $derived(
		chartSeries
			.map((item) =>
				chartSummary(
					item.label,
					item.values[0] ?? 0,
					item.values[item.values.length - 1] ?? 0,
					session.month
				)
			)
			.join(' ')
	);

	const currentPreset = $derived(presetOf(session.scenario.id));
	const hasProgress = $derived(session.month > 0 || session.pending.length > 0);

	function openPanel(cell: CellRef): void {
		lastCell = cell;
		session.selection = cell;
	}

	async function closePanel(): Promise<void> {
		session.selection = null;
		await tick();
		if (lastCell !== null) stage?.focusCell(lastCell);
	}

	function requestPreset(preset: LabScenarioId): void {
		if (preset === currentPreset) return;
		if (!hasProgress) {
			session.reset(scenarioOf(preset));
			return;
		}
		pendingPreset = preset;
		confirmOpen = true;
	}

	function confirmPreset(): void {
		if (pendingPreset !== null) session.reset(scenarioOf(pendingPreset));
		pendingPreset = null;
		confirmOpen = false;
	}

	function isTypingTarget(target: HTMLElement): boolean {
		if (target.closest('dialog') !== null) return true;
		if (target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return true;
		if (target.isContentEditable) return true;
		if (!(target instanceof HTMLInputElement)) return false;
		return target.type !== 'radio' && target.type !== 'checkbox' && target.type !== 'range';
	}

	function handleShortcut(event: KeyboardEvent): void {
		if (!settings.keyboardShortcuts || event.ctrlKey || event.metaKey || event.altKey) return;
		const target = event.target;
		if (!(target instanceof HTMLElement) || root === null || !root.contains(target)) return;
		if (isTypingTarget(target)) return;
		const key = event.key.toLowerCase();
		const speed = speedOptions[['1', '2', '3'].indexOf(key)];
		if (key === 'p') session.togglePlay();
		else if (key === 'n') session.step();
		else if (speed !== undefined) session.setSpeed(speed);
		else if (key === 'i') announcer.announce(session.waterCellNameOf(session.focusedSegment));
		else if (key === 't') tableOpen = !tableOpen;
		else if (key === '?') shell.helpOpen = true;
		else return;
		event.preventDefault();
	}

	$effect(() => {
		shell.skipLinks = [
			{ targetId: stageSectionId, label: lab.skipToStage },
			{ targetId: timeSectionId, label: lab.skipToTime }
		];
		shell.fullWidth = true;
		return () => {
			shell.skipLinks = [];
			shell.fullWidth = false;
			session.dispose();
		};
	});

	$effect(() => {
		const preset = presetOf(page.url.searchParams.get('preset'));
		untrack(() => {
			if (preset !== session.scenario.id) session.reset(scenarioOf(preset));
		});
	});
</script>

<svelte:head>
	<title>{lab.pageTitle}</title>
	<meta name="description" content={lab.lead} />
</svelte:head>

<svelte:window onkeydown={handleShortcut} />

<div bind:this={root} class="flex flex-col gap-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-2xl md:text-3xl">{lab.title}</h1>
			<p class="mt-2 max-w-[var(--measure-prose)] text-ink-muted">{lab.lead}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			<label for={presetSelectId} class="font-medium">{lab.scenarioLabel}</label>
			<select
				id={presetSelectId}
				value={currentPreset}
				onchange={(event) => requestPreset(presetOf(event.currentTarget.value))}
				class="min-h-11 rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface px-3"
			>
				{#each labPresetIds as id (id)}
					<option value={id}>{presetNames[id]}</option>
				{/each}
				{#if currentPreset === demoPreset}
					<option value={demoPreset}>{presetLabel(demoPreset)}</option>
				{/if}
			</select>
		</div>
	</div>

	<div
		class="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_19rem] xl:grid-cols-[17rem_minmax(0,1fr)_21rem]"
	>
		{#if viewport === 'phone'}
			<section
				aria-labelledby="judul-indikator"
				class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
			>
				<h2 id="judul-indikator" class="mb-2 text-base">{lab.indicatorsTitle}</h2>
				<IndicatorPanel compact={true} />
			</section>
			<div class="flex flex-wrap gap-2">
				<Button variant="secondary" aria-haspopup="dialog" onclick={() => (toolsOpen = true)}>
					{lab.openTools}
				</Button>
				<Button variant="secondary" aria-haspopup="dialog" onclick={() => (inspectorOpen = true)}>
					{lab.inspectorTitle}
				</Button>
			</div>
		{/if}

		{#if viewport === 'desktop'}
			<aside
				aria-label={lab.paletteTitle}
				class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
			>
				<h2 class="mb-2 text-lg">{lab.paletteTitle}</h2>
				<Toolbox />
			</aside>
		{/if}

		<section
			id={stageSectionId}
			tabindex="-1"
			aria-label={lab.stageRegion}
			class="max-w-fit focus-visible:outline-offset-4"
		>
			<RiverStage bind:this={stage} onactivate={openPanel} />
			<div class="mt-3 flex flex-col gap-3">
				<div>
					<Button
						variant="secondary"
						size="sm"
						aria-expanded={tableOpen}
						aria-controls={tableId}
						onclick={() => (tableOpen = !tableOpen)}
					>
						{lab.tableToggle}
					</Button>
				</div>
				{#if tableOpen}
					<div
						id={tableId}
						class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
					>
						<RiverTableView />
					</div>
				{/if}
			</div>
		</section>

		{#if viewport === 'phone'}
			<section
				aria-labelledby="judul-narator"
				class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
			>
				<h2 id="judul-narator" class="mb-2 text-base">{narration.title}</h2>
				<NarratorPanel compact={true} />
			</section>
		{/if}

		{#if viewport === 'desktop'}
			<aside aria-label={lab.panelTitle} class="flex flex-col gap-4">
				{#if session.selection !== null}
					{#key `${session.selection.segment}-${session.selection.column}`}
						<TileActionPanel cell={session.selection} inline={true} onclose={closePanel} />
					{/key}
				{/if}
				<section
					aria-labelledby="judul-indikator"
					class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
				>
					<h2 id="judul-indikator" class="mb-3 text-lg">{lab.indicatorsTitle}</h2>
					<IndicatorPanel />
				</section>
				<section
					aria-labelledby="judul-narator"
					class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
				>
					<h2 id="judul-narator" class="mb-3 text-lg">{narration.title}</h2>
					<NarratorPanel />
				</section>
				<section
					aria-labelledby="judul-inspektor"
					class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
				>
					<h2 id="judul-inspektor" class="mb-3 text-lg">{lab.inspectorTitle}</h2>
					<SegmentInspector />
				</section>
			</aside>
		{:else if viewport === 'tablet'}
			<section
				aria-label={lab.panelTitle}
				class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
			>
				<Tabs tabs={panelTabs} bind:active={activeTab} label={lab.panelTitle}>
					{#snippet panel(id)}
						<h2 class="sr-only">{panelTabs.find((tab) => tab.id === id)?.label ?? ''}</h2>
						{#if id === 'tools'}
							<Toolbox />
						{:else if id === 'narrator'}
							<NarratorPanel />
						{:else if id === 'indicators'}
							<IndicatorPanel />
						{:else}
							<SegmentInspector />
						{/if}
					{/snippet}
				</Tabs>
			</section>
		{/if}

		<section
			id={timeSectionId}
			tabindex="-1"
			aria-label={lab.timeRegion}
			class="focus-visible:outline-offset-4 lg:col-span-3 {viewport === 'phone'
				? 'sticky bottom-0 z-20'
				: ''}"
		>
			<TimeControls />
		</section>

		<section
			aria-labelledby="judul-riwayat"
			class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3 lg:col-span-3"
		>
			<h2 id="judul-riwayat" class="mb-3 text-lg">{lab.chartTitle}</h2>
			<LineChart
				title={lab.chartTitle}
				series={chartSeries}
				xLabel={lab.chartX}
				summary={chartText}
				seeDataLabel={lab.seeData}
			/>
		</section>
	</div>
</div>

{#if !inlinePanel && session.selection !== null}
	{#key `${session.selection.segment}-${session.selection.column}`}
		<TileActionPanel cell={session.selection} inline={false} onclose={closePanel} />
	{/key}
{/if}

{#if viewport === 'phone'}
	<Sheet bind:open={toolsOpen} title={lab.paletteTitle}>
		<Toolbox />
	</Sheet>
	<Sheet bind:open={inspectorOpen} title={lab.inspectorTitle}>
		<SegmentInspector />
	</Sheet>
{/if}

<Dialog
	bind:open={confirmOpen}
	title={lab.scenarioChangeTitle}
	description={lab.scenarioChangeBody}
>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (confirmOpen = false)}>{lab.cancel}</Button>
		<Button variant="danger" onclick={confirmPreset}>{lab.confirm}</Button>
	{/snippet}
	<p class="text-sm text-ink-muted">
		{pendingPreset === null ? '' : presetLabel(pendingPreset)}
	</p>
</Dialog>

<EventDialog />
