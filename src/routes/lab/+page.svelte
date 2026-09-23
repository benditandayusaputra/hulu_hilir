<script lang="ts">
	import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpen from '@lucide/svelte/icons/panel-right-open';
	import Table2 from '@lucide/svelte/icons/table-2';
	import X from '@lucide/svelte/icons/x';
	import { setContext, tick, untrack } from 'svelte';
	import { page } from '$app/state';
	import LineChart from '$lib/components/charts/LineChart.svelte';
	import EventDialog from '$lib/components/river/EventDialog.svelte';
	import IndicatorPanel from '$lib/components/river/IndicatorPanel.svelte';
	import NarratorPanel from '$lib/components/river/NarratorPanel.svelte';
	import RiverSprites from '$lib/components/river/RiverSprites.svelte';
	import RiverStage from '$lib/components/river/RiverStage.svelte';
	import RewindControl from '$lib/components/river/RewindControl.svelte';
	import RiverTableView from '$lib/components/river/RiverTableView.svelte';
	import SegmentInspector from '$lib/components/river/SegmentInspector.svelte';
	import TileActionPanel from '$lib/components/river/TileActionPanel.svelte';
	import TimeControls from '$lib/components/river/TimeControls.svelte';
	import Toolbox from '$lib/components/river/Toolbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import Tabs from '$lib/components/ui/Tabs.svelte';
	import WorldArt from '$lib/components/world/art/WorldArt.svelte';
	import CameraControls from '$lib/components/world/CameraControls.svelte';
	import RiverWorld from '$lib/components/world/RiverWorld.svelte';
	import {
		chartSummary,
		eventNames,
		indicatorNames,
		lab,
		labPresetIds,
		presetNames,
		type LabPresetId
	} from '$lib/content/lab';
	import { narration } from '$lib/content/narration';
	import { scenarioById, segmentIndices, type Indicators, type Scenario } from '$lib/sim';
	import { announcer } from '$lib/state/announcer.svelte';
	import { desktopQuery, phoneQuery, viewportOf, watchMedia } from '$lib/state/media';
	import { settings } from '$lib/state/settings.svelte';
	import { shell } from '$lib/state/shell.svelte';
	import {
		cellTileId,
		sessionKey,
		SimulationSession,
		speedOptions,
		WATER_COLUMN,
		type CellRef
	} from '$lib/state/simulation.svelte';
	import { intersects } from '$lib/world/camera';
	import { cameraKey, WorldCamera } from '$lib/world/camera.svelte';
	import { segmentLayout } from '$lib/world/layout';

	const defaultPreset: LabPresetId = 'desa';
	const demoPreset = 'demo';
	type LabScenarioId = LabPresetId | typeof demoPreset;
	const stageSectionId = 'panggung-sungai';
	const timeSectionId = 'kontrol-waktu';
	const presetSelectId = 'pilihan-skenario';
	const tableId = 'tabel-sungai';
	const sidePanelId = 'panel-samping';

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
	const camera = new WorldCamera();
	setContext(cameraKey, camera);

	let root = $state<HTMLDivElement | null>(null);
	let stage = $state<RiverStage | null>(null);
	let stageSection = $state<HTMLElement | null>(null);
	let mapButton = $state<HTMLButtonElement | null>(null);
	let lastCell = $state<CellRef | null>(null);
	let focusedCell = $state<CellRef | null>(null);
	let stageFocused = $state(false);
	let pendingPreset = $state<LabScenarioId | null>(null);
	let confirmOpen = $state(false);
	let tableOpen = $state(false);
	let mapOpen = $state(false);
	let panelSheetOpen = $state(false);
	let panelOpen = $state(true);
	let activeTab = $state('narrator');

	let phoneMatch = $state(false);
	let desktopMatch = $state(true);
	const viewport = $derived(viewportOf(phoneMatch, desktopMatch));
	const desktop = $derived(viewport === 'desktop');
	const panelTabs = [
		{ id: 'narrator', label: narration.tabNarrator },
		{ id: 'inspector', label: lab.tabInspector },
		{ id: 'history', label: lab.tabHistory }
	];

	$effect(() => {
		const stopPhone = watchMedia(phoneQuery, (matches) => (phoneMatch = matches));
		const stopDesktop = watchMedia(desktopQuery, (matches) => {
			desktopMatch = matches;
			panelOpen = matches;
		});
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
	const inView = $derived(
		segmentIndices.filter((index) => {
			const { anchor } = segmentLayout(index);
			return intersects(camera.visible, { x: anchor.x, y: anchor.y, width: 1, height: 1 });
		})
	);
	const weatherText = $derived.by(() => {
		const events = session.latest.events;
		if (events.some((event) => event.type === 'extreme_rain')) return eventNames.extreme_rain;
		if (events.some((event) => event.type === 'heavy_rain')) return eventNames.heavy_rain;
		if (session.latest.droughtActive) return eventNames.drought;
		return '';
	});

	function flyToCell(cell: CellRef, close = false): void {
		const tile = cellTileId(cell);
		if (tile === null) void camera.flyToSegment(cell.segment, close);
		else void camera.flyToTile(tile, close);
	}

	function openPanel(cell: CellRef): void {
		lastCell = cell;
		session.selection = cell;
		session.focusedSegment = cell.segment;
	}

	function activateFromMap(cell: CellRef): void {
		openPanel(cell);
		flyToCell(cell);
	}

	function focusFromMap(cell: CellRef): void {
		focusedCell = cell;
		flyToCell(cell);
	}

	async function closePanel(): Promise<void> {
		session.selection = null;
		await tick();
		if (lastCell === null) return;
		if (stage?.focusCell(lastCell)) return;
		if (mapButton !== null) mapButton.focus();
		else stageSection?.focus();
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

	function runShortcut(key: string): boolean {
		const speed = speedOptions[['1', '2', '3'].indexOf(key)];
		if (key === 'p') session.togglePlay();
		else if (key === 'n') session.step();
		else if (speed !== undefined) session.setSpeed(speed);
		else if (key === 'i') announcer.announce(session.waterCellNameOf(session.focusedSegment));
		else if (key === 't') tableOpen = !tableOpen;
		else if (key === '?') shell.helpOpen = true;
		else if (key === '+' || key === '=') void camera.zoomIn();
		else if (key === '-') void camera.zoomOut();
		else if (key === '0') void camera.showAll();
		else if (key === 'f')
			flyToCell(stage?.focusedCell() ?? { segment: 1, column: WATER_COLUMN }, true);
		else return false;
		return true;
	}

	function handleShortcut(event: KeyboardEvent): void {
		if (!settings.keyboardShortcuts || event.ctrlKey || event.metaKey || event.altKey) return;
		const target = event.target;
		if (!(target instanceof HTMLElement) || root === null || !root.contains(target)) return;
		if (isTypingTarget(target)) return;
		if (runShortcut(event.key.toLowerCase())) event.preventDefault();
	}

	$effect(() => {
		shell.skipLinks = [
			{ targetId: stageSectionId, label: lab.skipToStage },
			{ targetId: timeSectionId, label: lab.skipToTime }
		];
		shell.immersive = true;
		return () => {
			shell.skipLinks = [];
			shell.immersive = false;
			session.dispose();
			camera.stop();
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

{#snippet stageMap(compact: boolean)}
	<RiverStage
		bind:this={stage}
		{compact}
		inView={compact ? inView : []}
		onactivate={activateFromMap}
		onfocuscell={focusFromMap}
	/>
{/snippet}

{#snippet scenarioPicker()}
	<div class="flex flex-wrap items-center gap-2">
		<label for={presetSelectId} class="text-sm font-medium">{lab.scenarioLabel}</label>
		<select
			id={presetSelectId}
			value={currentPreset}
			onchange={(event) => requestPreset(presetOf(event.currentTarget.value))}
			class="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface px-3"
		>
			{#each labPresetIds as id (id)}
				<option value={id}>{presetNames[id]}</option>
			{/each}
			{#if currentPreset === demoPreset}
				<option value={demoPreset}>{presetLabel(demoPreset)}</option>
			{/if}
		</select>
	</div>
{/snippet}

{#snippet panelTabsView()}
	<Tabs tabs={panelTabs} bind:active={activeTab} label={lab.panelTitle}>
		{#snippet panel(id)}
			{#if id === 'narrator'}
				<section aria-labelledby="judul-narator">
					<h2 id="judul-narator" class="sr-only">{narration.title}</h2>
					<NarratorPanel />
				</section>
			{:else if id === 'inspector'}
				<section aria-labelledby="judul-inspektor">
					<h2 id="judul-inspektor" class="mb-3 text-lg">{lab.inspectorTitle}</h2>
					<SegmentInspector />
				</section>
			{:else}
				<h2 class="mb-3 text-lg">{lab.chartTitle}</h2>
				<div class="mb-3">
					<RewindControl />
				</div>
				<LineChart
					title={lab.chartTitle}
					series={chartSeries}
					xLabel={lab.chartX}
					summary={chartText}
					seeDataLabel={lab.seeData}
				/>
			{/if}
		{/snippet}
	</Tabs>
{/snippet}

{#snippet stageSectionView()}
	<section
		id={stageSectionId}
		bind:this={stageSection}
		tabindex="-1"
		aria-labelledby="judul-peta-petak"
		onfocusin={() => (stageFocused = true)}
		onfocusout={() => (stageFocused = false)}
		class="pointer-events-auto shrink-0 focus-visible:outline-offset-4 {desktop
			? 'rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface/95 p-2 shadow-md'
			: ''}"
	>
		<h2 id="judul-peta-petak" class="sr-only">{lab.tileMap}</h2>
		{#if desktop}
			{@render stageMap(true)}
		{:else}
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					bind:this={mapButton}
					aria-haspopup="dialog"
					onclick={() => (mapOpen = true)}
					class="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border-[1.5px] border-ink/15 bg-surface px-3 font-medium"
				>
					<Grid3x3 size={20} aria-hidden="true" />
					{lab.tileMap}
				</button>
				{#if viewport === 'phone'}
					<Button
						variant="secondary"
						aria-haspopup="dialog"
						onclick={() => (panelSheetOpen = true)}
					>
						{lab.panelTitle}
					</Button>
				{/if}
			</div>
		{/if}
	</section>
{/snippet}

{#snippet tableToggle()}
	<Button
		variant="secondary"
		size="sm"
		aria-expanded={tableOpen}
		aria-controls={tableId}
		onclick={() => (tableOpen = !tableOpen)}
	>
		{#snippet icon()}<Table2 size={18} />{/snippet}
		{lab.tableToggle}
	</Button>
{/snippet}

<RiverSprites />
<WorldArt />

<div bind:this={root} class="lab-root relative h-full overflow-hidden bg-surface-2">
	<RiverWorld
		focused={stageFocused ? focusedCell : null}
		onselect={(cell) => {
			openPanel(cell);
			stage?.markFocused(cell);
		}}
	/>

	<div class="pointer-events-none absolute inset-x-2 top-2 flex items-start gap-2">
		<section
			aria-labelledby="judul-lab"
			class="pointer-events-auto flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface/95 px-3 py-2 shadow-md lg:flex-none"
		>
			<h1 id="judul-lab" class="text-lg max-sm:sr-only">{lab.title}</h1>
			{#if !desktop}
				<div class="flex flex-wrap items-center gap-2 max-sm:w-full">
					{@render stageSectionView()}
					{@render tableToggle()}
				</div>
			{/if}
			<h2 class="sr-only">{lab.indicatorsTitle}</h2>
			<div class="min-w-0 flex-1 max-lg:basis-full lg:flex-none">
				<IndicatorPanel />
			</div>
			{#if weatherText !== '' || session.enforcementActive}
				<p class="flex flex-wrap gap-1 text-sm">
					{#if weatherText !== ''}
						<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5">{weatherText}</span>
					{/if}
					{#if session.enforcementActive}
						<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5">
							{lab.enforcementActive}
						</span>
					{/if}
				</p>
			{/if}
			{#if desktop}
				{@render tableToggle()}
			{/if}
		</section>
	</div>

	{#if tableOpen}
		<section
			id={tableId}
			aria-labelledby="judul-tabel"
			class="absolute top-28 left-1/2 z-20 max-h-[calc(100%-9rem)] w-[min(46rem,calc(100%-1rem))] -translate-x-1/2 overflow-auto rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-4 shadow-lg"
		>
			<div class="mb-3 flex items-start justify-between gap-2">
				<h2 id="judul-tabel" class="text-lg">{lab.tableToggle}</h2>
				<Button variant="ghost" size="sm" onclick={() => (tableOpen = false)}>
					{#snippet icon()}<X size={18} />{/snippet}
					{lab.closeTable}
				</Button>
			</div>
			<RiverTableView />
		</section>
	{/if}

	{#if viewport !== 'phone'}
		<aside
			id={sidePanelId}
			aria-label={lab.panelTitle}
			class="pointer-events-auto absolute top-28 right-2 bottom-40 z-10 flex w-[min(22rem,calc(100%-1rem))] flex-col gap-3 overflow-y-auto rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3 shadow-lg {panelOpen
				? ''
				: 'hidden'}"
		>
			{@render scenarioPicker()}
			{@render panelTabsView()}
		</aside>
	{/if}

	<div
		class="pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 {panelOpen &&
		viewport !== 'phone'
			? 'right-[calc(min(22rem,100%-1rem)+1.25rem)]'
			: 'right-2'}"
	>
		<div class="pointer-events-auto flex flex-col gap-2">
			{#if viewport !== 'phone'}
				<button
					type="button"
					aria-expanded={panelOpen}
					aria-controls={sidePanelId}
					aria-label={panelOpen ? lab.panelHide : lab.panelShow}
					onclick={() => (panelOpen = !panelOpen)}
					class="grid size-11 place-items-center rounded-full border-[1.5px] border-ink/15 bg-surface text-ink shadow-md hover:bg-surface-2"
				>
					{#if panelOpen}
						<PanelRightClose size={22} aria-hidden="true" />
					{:else}
						<PanelRightOpen size={22} aria-hidden="true" />
					{/if}
				</button>
			{/if}
			<CameraControls />
		</div>
	</div>

	{#if desktop && session.selection !== null}
		<div
			class="absolute top-28 left-[calc(50%+8rem)] z-20 max-h-[calc(100%-18rem)] w-[min(22rem,calc(50%-9rem))] min-w-72 overflow-y-auto shadow-lg"
		>
			{#key `${session.selection.segment}-${session.selection.column}`}
				<TileActionPanel cell={session.selection} inline={true} onclose={closePanel} />
			{/key}
		</div>
	{/if}

	<div
		class="pointer-events-none absolute inset-x-2 bottom-2 flex flex-col gap-2 md:flex-row md:items-end"
	>
		{#if desktop}
			{@render stageSectionView()}
		{/if}

		<section
			aria-labelledby="judul-hotbar"
			class="pointer-events-auto min-w-0 flex-1 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface/95 p-2 shadow-md"
		>
			<h2 id="judul-hotbar" class="sr-only">{lab.paletteTitle}</h2>
			<Toolbox compact={!desktop} />
		</section>

		<section
			id={timeSectionId}
			tabindex="-1"
			aria-label={lab.timeRegion}
			class="pointer-events-auto shrink-0 focus-visible:outline-offset-4 max-md:order-first md:w-[22rem]"
		>
			<TimeControls stacked={viewport === 'phone'} />
		</section>
	</div>
</div>

{#if !desktop && session.selection !== null}
	{#key `${session.selection.segment}-${session.selection.column}`}
		<TileActionPanel cell={session.selection} inline={false} onclose={closePanel} />
	{/key}
{/if}

{#if !desktop}
	<Sheet bind:open={mapOpen} title={lab.tileMap}>
		{@render stageMap(false)}
	</Sheet>
{/if}

{#if viewport === 'phone'}
	<Sheet bind:open={panelSheetOpen} title={lab.panelTitle}>
		<div class="flex flex-col gap-3">
			{@render scenarioPicker()}
			{@render panelTabsView()}
		</div>
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
