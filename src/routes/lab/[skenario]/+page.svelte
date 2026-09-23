<script lang="ts">
	import { autoUpdate, computePosition, flip, offset, shift, size } from '@floating-ui/dom';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import Eye from '@lucide/svelte/icons/eye';
	import EyeOff from '@lucide/svelte/icons/eye-off';
	import Grid3x3 from '@lucide/svelte/icons/grid-3x3';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Minimize from '@lucide/svelte/icons/minimize';
	import PanelRight from '@lucide/svelte/icons/panel-right';
	import PanelRightClose from '@lucide/svelte/icons/panel-right-close';
	import PanelRightOpen from '@lucide/svelte/icons/panel-right-open';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import Table2 from '@lucide/svelte/icons/table-2';
	import X from '@lucide/svelte/icons/x';
	import { setContext, tick, untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import RoundButton from '$lib/components/hud/art/RoundButton.svelte';
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
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import WorldArt from '$lib/components/world/art/WorldArt.svelte';
	import CameraControls from '$lib/components/world/CameraControls.svelte';
	import RiverWorld from '$lib/components/world/RiverWorld.svelte';
	import {
		chartSummary,
		demoPresetId,
		eventNames,
		indicatorNames,
		lab,
		labRouteName,
		type LabRouteId
	} from '$lib/content/lab';
	import { narration } from '$lib/content/narration';
	import { scenarioById, segmentIndices, type Indicators, type Scenario } from '$lib/sim';
	import { announcer } from '$lib/state/announcer.svelte';
	import {
		clearLabSession,
		readLabSession,
		replayLabSession,
		writeLabSession
	} from '$lib/state/labStorage';
	import { desktopQuery, phoneQuery, viewportOf, watchMedia } from '$lib/state/media';
	import { settings } from '$lib/state/settings.svelte';
	import { shell } from '$lib/state/shell.svelte';
	import { toaster } from '$lib/state/toast.svelte';
	import {
		cellTileId,
		sessionKey,
		SimulationSession,
		speedOptions,
		WATER_COLUMN,
		type CellRef
	} from '$lib/state/simulation.svelte';
	import { intersects, worldToScreen } from '$lib/world/camera';
	import { cameraKey, WorldCamera } from '$lib/world/camera.svelte';
	import { plotById, segmentLayout } from '$lib/world/layout';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const stageSectionId = 'panggung-sungai';
	const timeSectionId = 'kontrol-waktu';
	const tableId = 'tabel-sungai';
	const sidePanelId = 'panel-samping';
	const pickerHref = resolve('/lab');
	const FLOAT_GAP_PX = 28;
	const FLOAT_PADDING_PX = 8;
	const FLOAT_MAX_HEIGHT_PX = 640;

	function scenarioOf(id: LabRouteId): Scenario {
		const scenario = scenarioById(id);
		if (scenario === null) throw new Error(`scenario ${id} missing`);
		return scenario;
	}

	const session = new SimulationSession(scenarioOf(untrack(() => data.id)));
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
	let restartOpen = $state(false);
	type PanelKey = keyof typeof lab.panelNames;
	type TooltipSide = 'top' | 'bottom' | 'left';
	const collapsed = $state<Record<PanelKey, boolean>>({
		hud: false,
		map: false,
		bar: false,
		time: false
	});
	let showUiButton = $state<HTMLButtonElement | null>(null);
	let hideUiButton = $state<HTMLButtonElement | null>(null);
	let focusBeforeHide: HTMLElement | null = null;
	let canFullscreen = $state(false);
	let fullscreen = $state(false);
	let openedId = $state<LabRouteId | null>(null);
	let tableOpen = $state(false);
	let mapOpen = $state(false);
	let panelSheetOpen = $state(false);
	let panelOpen = $state(true);
	let activeTab = $state('narrator');
	let floating = $state<HTMLDivElement | null>(null);
	let freeArea = $state<HTMLDivElement | null>(null);
	let floatPlaced = $state(false);
	let repositionPanel: (() => void) | null = null;

	let phoneMatch = $state(false);
	let desktopMatch = $state(true);
	const viewport = $derived(viewportOf(phoneMatch, desktopMatch));
	const desktop = $derived(viewport === 'desktop');
	const hudSide = $derived<TooltipSide>(
		viewport === 'tablet' && !collapsed.hud ? 'left' : 'bottom'
	);
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

	const scenarioName = $derived(labRouteName(data.id));
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

	const chipClass =
		'paper inline-flex min-h-11 items-center gap-2 px-3 text-base font-semibold hover:bg-surface-2';

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

	function anchorOf(cell: CellRef): { x: number; y: number } {
		const tile = cellTileId(cell);
		const plot = tile === null ? null : plotById(tile);
		return plot?.center ?? segmentLayout(cell.segment).anchor;
	}

	$effect(() => {
		const element = floating;
		const bounds = freeArea;
		const cell = session.selection;
		const stageRoot = root;
		if (element === null || bounds === null || cell === null || stageRoot === null) return;
		const reference = {
			getBoundingClientRect: () =>
				untrack(() => {
					const origin = stageRoot.getBoundingClientRect();
					const anchor = anchorOf(cell);
					const point = worldToScreen(camera.current, camera.view, anchor.x, anchor.y);
					return new DOMRect(origin.left + point.x, origin.top + point.y, 0, 0);
				})
		};
		const update = (): void => {
			void computePosition(reference, element, {
				placement: 'right',
				middleware: [
					offset(FLOAT_GAP_PX),
					flip({ boundary: bounds, fallbackPlacements: ['left', 'bottom', 'top'] }),
					shift({ boundary: bounds, crossAxis: true, padding: FLOAT_PADDING_PX }),
					size({
						boundary: bounds,
						padding: FLOAT_PADDING_PX,
						apply: ({ availableHeight }) => {
							element.style.maxHeight = `${Math.max(0, Math.min(availableHeight, FLOAT_MAX_HEIGHT_PX))}px`;
						}
					})
				]
			}).then(({ x, y }) => {
				element.style.left = `${x}px`;
				element.style.top = `${y}px`;
				floatPlaced = true;
			});
		};
		repositionPanel = update;
		const stop = autoUpdate(reference, element, update);
		return () => {
			stop();
			repositionPanel = null;
			floatPlaced = false;
		};
	});

	$effect(() => {
		void camera.current;
		void camera.view;
		repositionPanel?.();
	});

	function openScenario(id: LabRouteId): void {
		const scenario = scenarioOf(id);
		session.reset(scenario);
		if (id !== demoPresetId) {
			const stored = readLabSession(id);
			if (stored.status === 'ok') {
				try {
					const replayed = replayLabSession(scenario, stored.session);
					session.restore(replayed.snapshots, replayed.pending, stored.session.seed);
				} catch {
					clearLabSession(id);
					toaster.show(lab.sessionReset, 'info');
				}
			} else if (stored.status === 'invalid') {
				clearLabSession(id);
				toaster.show(lab.sessionReset, 'info');
			}
		}
		openedId = id;
	}

	function restart(): void {
		restartOpen = false;
		session.reset(scenarioOf(data.id));
	}

	async function hideUi(): Promise<void> {
		const active = document.activeElement;
		focusBeforeHide = active instanceof HTMLElement && active !== document.body ? active : null;
		session.selection = null;
		shell.uiHidden = true;
		announcer.announce(lab.uiHidden);
		await tick();
		showUiButton?.focus();
	}

	async function showUi(): Promise<void> {
		shell.uiHidden = false;
		await tick();
		const target = focusBeforeHide;
		focusBeforeHide = null;
		if (target !== null && target.isConnected) target.focus();
		if (document.activeElement !== target) hideUiButton?.focus();
	}

	function toggleUi(): void {
		if (shell.uiHidden) void showUi();
		else void hideUi();
	}

	function toggleFullscreen(): void {
		const request = document.fullscreenElement
			? document.exitFullscreen()
			: document.documentElement.requestFullscreen();
		request.catch(() => undefined);
	}

	$effect(() => {
		canFullscreen = document.fullscreenEnabled;
		const update = () => (fullscreen = document.fullscreenElement !== null);
		update();
		document.addEventListener('fullscreenchange', update);
		return () => document.removeEventListener('fullscreenchange', update);
	});

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
		else if (key === 'h') toggleUi();
		else return false;
		return true;
	}

	function handleShortcut(event: KeyboardEvent): void {
		if (
			event.key === 'Escape' &&
			shell.uiHidden &&
			document.querySelector('dialog[open]') === null
		) {
			event.preventDefault();
			void showUi();
			return;
		}
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
		shell.uiHidden = false;
		return () => {
			shell.skipLinks = [];
			shell.immersive = false;
			shell.uiHidden = false;
			session.dispose();
			camera.stop();
		};
	});

	$effect(() => {
		const id = data.id;
		untrack(() => openScenario(id));
	});

	$effect(() => {
		const id = openedId;
		if (id === null || id === demoPresetId || id !== session.scenario.id) return;
		const stored = {
			preset: id,
			seed: session.seed,
			month: session.month,
			actions: [...session.log, ...session.pending]
		};
		untrack(() => writeLabSession(stored));
	});
</script>

<svelte:head>
	<title>{lab.pageTitle(scenarioName)}</title>
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

{#snippet scenarioActions()}
	<div class="flex flex-wrap items-center gap-2">
		<p class="basis-full text-sm">
			<span class="font-semibold">{lab.scenarioLabel}:</span>
			{scenarioName}
		</p>
		<a
			href={pickerHref}
			class="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface px-4 font-medium text-ink hover:bg-surface-2"
		>
			<ArrowLeft size={18} aria-hidden="true" />
			{lab.changeScenario}
		</a>
		<Button variant="secondary" onclick={() => (restartOpen = true)}>
			{#snippet icon()}<RotateCcw size={18} />{/snippet}
			{lab.restart}
		</Button>
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

{#snippet panelToggle(key: PanelKey, foldsUp: boolean, side: TooltipSide)}
	{@const name = lab.panelNames[key]}
	{@const label = collapsed[key] ? lab.expandPanel(name) : lab.collapsePanel(name)}
	<Tooltip text={label} {side}>
		{#snippet children(describedBy)}
			<RoundButton
				{label}
				small
				aria-expanded={!collapsed[key]}
				aria-controls="panel-{key}"
				aria-describedby={describedBy}
				onclick={() => (collapsed[key] = !collapsed[key])}
			>
				{#if collapsed[key] === foldsUp}
					<ChevronDown size={20} aria-hidden="true" />
				{:else}
					<ChevronUp size={20} aria-hidden="true" />
				{/if}
			</RoundButton>
		{/snippet}
	</Tooltip>
{/snippet}

{#snippet stageSectionView()}
	<section
		id={stageSectionId}
		bind:this={stageSection}
		tabindex="-1"
		aria-labelledby="judul-peta-petak"
		onfocusin={() => (stageFocused = true)}
		onfocusout={() => (stageFocused = false)}
		class="pointer-events-auto focus-visible:outline-offset-4 {desktop
			? 'lab-map wood wood-nails relative flex flex-col gap-1.5 px-3 pt-2 pb-3'
			: 'flex flex-wrap gap-2'}"
	>
		{#if desktop}
			<h2 id="judul-peta-petak" class="flex min-h-11 items-center px-1 pe-14 text-base">
				{lab.tileMap}
			</h2>
			<div id="panel-map" hidden={collapsed.map}>
				{@render stageMap(true)}
			</div>
			<div class="absolute top-2 right-3">
				{@render panelToggle('map', false, 'top')}
			</div>
		{:else}
			<h2 id="judul-peta-petak" class="sr-only">{lab.tileMap}</h2>
			<button
				type="button"
				bind:this={mapButton}
				aria-haspopup="dialog"
				onclick={() => (mapOpen = true)}
				class={chipClass}
			>
				<Grid3x3 size={20} aria-hidden="true" />
				{lab.tileMap}
			</button>
			{#if viewport === 'phone'}
				<button
					type="button"
					aria-haspopup="dialog"
					onclick={() => (panelSheetOpen = true)}
					class={chipClass}
				>
					<PanelRight size={20} aria-hidden="true" />
					{lab.panelTitle}
				</button>
			{/if}
		{/if}
	</section>
{/snippet}

{#snippet tableToggle()}
	<button
		type="button"
		aria-expanded={tableOpen}
		aria-controls={tableId}
		onclick={() => (tableOpen = !tableOpen)}
		class={chipClass}
	>
		<Table2 size={20} aria-hidden="true" />
		<span><span class="max-sm:sr-only">{lab.tableTogglePrefix}</span> {lab.tableToggleShort}</span>
	</button>
{/snippet}

<RiverSprites />
<WorldArt />

<div bind:this={root} class="lab-root relative h-full overflow-hidden bg-surface-2">
	<RiverWorld
		focused={stageFocused ? focusedCell : null}
		onselect={(cell) => {
			if (shell.uiHidden) return;
			openPanel(cell);
			stage?.markFocused(cell);
		}}
	/>

	<div
		inert={shell.uiHidden}
		class="lab-grid ui-layer pointer-events-none absolute inset-x-2 bottom-2"
	>
		<div bind:this={freeArea} class="lab-free"></div>

		<section
			aria-labelledby="judul-lab"
			class="lab-hud wood wood-nails pointer-events-auto flex min-w-0 flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-2 sm:px-5 {collapsed.hud
				? 'justify-self-start'
				: ''}"
		>
			<h1 id="judul-lab" class="text-xl {collapsed.hud ? '' : 'max-xl:sr-only'}">{lab.title}</h1>
			<div id="panel-hud" class="contents" hidden={collapsed.hud}>
				<h2 class="sr-only">{lab.indicatorsTitle}</h2>
				<div class="min-w-0 flex-1 max-sm:basis-full">
					<IndicatorPanel />
				</div>
				{#if weatherText !== '' || session.enforcementActive}
					<p
						class="flex flex-wrap gap-1 text-sm text-shadow-none max-lg:order-last max-lg:basis-full"
					>
						{#if weatherText !== ''}
							<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5 text-ink"
								>{weatherText}</span
							>
						{/if}
						{#if session.enforcementActive}
							<span class="rounded-[var(--radius-chip)] bg-surface-2 px-2 py-0.5 text-ink">
								{lab.enforcementActive}
							</span>
						{/if}
					</p>
				{/if}
				{#if desktop}
					{@render tableToggle()}
				{/if}
			</div>
			<div class="ms-auto flex items-center gap-2 {collapsed.hud ? '' : 'sm:max-lg:flex-col'}">
				{@render panelToggle('hud', true, hudSide)}
				<Tooltip text="{lab.hideUi}, {lab.shortcut}: H" side={hudSide}>
					{#snippet children(describedBy)}
						<RoundButton
							bind:element={hideUiButton}
							label={lab.hideUi}
							small
							aria-describedby={describedBy}
							onclick={() => void hideUi()}
						>
							<EyeOff size={20} aria-hidden="true" />
						</RoundButton>
					{/snippet}
				</Tooltip>
				{#if canFullscreen}
					<Tooltip text={fullscreen ? lab.exitFullscreen : lab.fullscreen} side={hudSide}>
						{#snippet children(describedBy)}
							<RoundButton
								label={fullscreen ? lab.exitFullscreen : lab.fullscreen}
								small
								on={fullscreen}
								aria-describedby={describedBy}
								onclick={toggleFullscreen}
							>
								{#if fullscreen}
									<Minimize size={20} aria-hidden="true" />
								{:else}
									<Maximize size={20} aria-hidden="true" />
								{/if}
							</RoundButton>
						{/snippet}
					</Tooltip>
				{/if}
			</div>
		</section>

		{#if desktop}
			{@render stageSectionView()}
		{:else}
			<div class="lab-chips pointer-events-auto flex flex-wrap items-start gap-2">
				{@render stageSectionView()}
				{@render tableToggle()}
			</div>
		{/if}

		<section
			aria-labelledby="judul-hotbar"
			class="lab-bar wood pointer-events-auto flex min-w-0 gap-2 px-2 pt-2 sm:px-3 {collapsed.bar
				? 'items-center justify-self-start pb-2'
				: 'items-start pb-1'}"
		>
			<h2 id="judul-hotbar" class={collapsed.bar ? 'px-1 text-base' : 'sr-only'}>
				{lab.paletteTitle}
			</h2>
			<div id="panel-bar" class="min-w-0 flex-1" hidden={collapsed.bar}>
				<Toolbox compact={!desktop} />
			</div>
			{@render panelToggle('bar', false, 'top')}
		</section>

		<div class="lab-side flex min-h-0 items-center justify-end gap-2">
			<div class="pointer-events-auto flex flex-col items-center gap-2">
				{#if viewport !== 'phone'}
					<Tooltip text={panelOpen ? lab.panelHide : lab.panelShow} side="left">
						{#snippet children(describedBy)}
							<RoundButton
								label={panelOpen ? lab.panelHide : lab.panelShow}
								aria-expanded={panelOpen}
								aria-controls={sidePanelId}
								aria-describedby={describedBy}
								onclick={() => (panelOpen = !panelOpen)}
							>
								{#if panelOpen}
									<PanelRightClose size={22} aria-hidden="true" />
								{:else}
									<PanelRightOpen size={22} aria-hidden="true" />
								{/if}
							</RoundButton>
						{/snippet}
					</Tooltip>
				{/if}
				<CameraControls small={viewport === 'phone'} />
			</div>

			{#if viewport !== 'phone'}
				<aside
					id={sidePanelId}
					aria-label={lab.panelTitle}
					class="lab-panel paper pointer-events-auto flex flex-col gap-3 self-stretch overflow-y-auto p-3 {panelOpen
						? ''
						: 'hidden'}"
				>
					{@render scenarioActions()}
					{@render panelTabsView()}
				</aside>
			{/if}
		</div>

		<section
			id={timeSectionId}
			tabindex="-1"
			aria-label={lab.timeRegion}
			class="lab-time pointer-events-auto flex items-center gap-2 focus-visible:outline-offset-4 {viewport ===
			'phone'
				? 'flex-col'
				: ''} {collapsed.time && viewport !== 'phone'
				? 'lab-time-folded wood wood-nails px-4 py-2'
				: ''}"
		>
			<div id="panel-time" hidden={collapsed.time}>
				<TimeControls stacked={viewport === 'phone'} />
			</div>
			{#if collapsed.time && viewport !== 'phone'}
				<p class="font-display text-base font-bold">{lab.timeRegion}</p>
			{/if}
			{@render panelToggle('time', false, viewport === 'phone' ? 'left' : 'top')}
		</section>

		{#if tableOpen}
			<section
				id={tableId}
				aria-labelledby="judul-tabel"
				class="lab-table paper pointer-events-auto z-20 min-h-0 overflow-auto p-4"
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
	</div>

	{#if shell.uiHidden}
		<div class="absolute right-2 bottom-2 z-10 flex flex-col items-center gap-2">
			<Tooltip text="{lab.showUi}, {lab.shortcut}: H" side="left">
				{#snippet children(describedBy)}
					<RoundButton
						bind:element={showUiButton}
						label={lab.showUi}
						small
						aria-describedby={describedBy}
						onclick={() => void showUi()}
					>
						<Eye size={20} aria-hidden="true" />
					</RoundButton>
				{/snippet}
			</Tooltip>
			<Tooltip text="{lab.shortcut}: P" side="left">
				{#snippet children(describedBy)}
					<RoundButton
						label={session.playing ? lab.pause : lab.play}
						small
						on={session.playing}
						aria-describedby={describedBy}
						onclick={() => session.togglePlay()}
					>
						{#if session.playing}
							<Pause size={20} aria-hidden="true" />
						{:else}
							<Play size={20} aria-hidden="true" />
						{/if}
					</RoundButton>
				{/snippet}
			</Tooltip>
			<CameraControls small />
		</div>
	{/if}

	{#if desktop && session.selection !== null}
		<div
			bind:this={floating}
			class="absolute top-0 left-0 z-20 flex w-80 flex-col drop-shadow-lg {floatPlaced
				? ''
				: 'opacity-0'}"
		>
			{#key `${session.selection.segment}-${session.selection.column}`}
				<TileActionPanel cell={session.selection} inline={true} onclose={closePanel} />
			{/key}
		</div>
	{/if}
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
			{@render scenarioActions()}
			{@render panelTabsView()}
		</div>
	</Sheet>
{/if}

<Dialog
	bind:open={restartOpen}
	title={lab.restartTitle}
	description={lab.restartBody(scenarioName)}
>
	{#snippet footer()}
		<Button variant="secondary" onclick={() => (restartOpen = false)}>{lab.cancel}</Button>
		<Button variant="danger" onclick={restart}>{lab.restart}</Button>
	{/snippet}
</Dialog>

<EventDialog />

<style>
	.lab-grid {
		top: calc(var(--shell-header, 3.25rem) + 0.5rem);
		display: grid;
		gap: 0.5rem;
		grid-template-columns: minmax(0, 1fr) auto;
		grid-template-rows: auto auto minmax(0, 1fr) auto auto;
		grid-template-areas:
			'hud hud'
			'chips chips'
			'free time'
			'free side'
			'bar bar';
	}

	.lab-free {
		grid-area: free;
	}

	.lab-hud {
		grid-area: hud;
	}

	.lab-chips {
		grid-area: chips;
	}

	.lab-bar {
		grid-area: bar;
	}

	.lab-side {
		grid-area: side;
	}

	.lab-panel {
		width: min(22rem, calc(100vw - 5rem));
	}

	.lab-time {
		grid-area: time;
		align-self: end;
		justify-self: end;
	}

	.lab-table {
		grid-area: free;
		grid-column: 1 / -1;
		justify-self: center;
		width: min(46rem, 100%);
	}

	@media (min-width: 640px) {
		.lab-grid {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-rows: auto auto minmax(0, 1fr) auto;
			grid-template-areas:
				'hud hud'
				'chips chips'
				'free side'
				'bar time';
		}

		.lab-time:not(.lab-time-folded) {
			justify-self: stretch;
		}
	}

	@media (min-width: 1024px) {
		.lab-grid {
			grid-template-columns: auto minmax(0, 1fr) auto;
			grid-template-rows: auto minmax(0, 1fr) auto;
			grid-template-areas:
				'hud hud hud'
				'map free side'
				'map bar time';
		}

		.lab-free {
			grid-row: 2 / 4;
		}

		.lab-hud {
			justify-self: start;
		}

		.lab-map {
			grid-area: map;
			align-self: end;
		}
	}
</style>
