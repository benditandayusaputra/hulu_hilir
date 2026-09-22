<script lang="ts">
	import { setContext, untrack } from 'svelte';
	import { page } from '$app/state';
	import IndicatorPanel from '$lib/components/river/IndicatorPanel.svelte';
	import RiverStage from '$lib/components/river/RiverStage.svelte';
	import TileActionPanel from '$lib/components/river/TileActionPanel.svelte';
	import TimeControls from '$lib/components/river/TimeControls.svelte';
	import Toolbox from '$lib/components/river/Toolbox.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { lab, labPresetIds, presetNames, type LabPresetId } from '$lib/content/lab';
	import { scenarioById, type Scenario } from '$lib/sim';
	import { announcer } from '$lib/state/announcer.svelte';
	import { settings } from '$lib/state/settings.svelte';
	import { shell } from '$lib/state/shell.svelte';
	import {
		sessionKey,
		SimulationSession,
		speedOptions,
		type CellRef
	} from '$lib/state/simulation.svelte';

	const defaultPreset: LabPresetId = 'desa';
	const stageSectionId = 'panggung-sungai';
	const timeSectionId = 'kontrol-waktu';
	const presetSelectId = 'pilihan-skenario';

	function presetOf(value: string | null): LabPresetId {
		return labPresetIds.find((id) => id === value) ?? defaultPreset;
	}

	function scenarioOf(preset: LabPresetId): Scenario {
		const scenario = scenarioById(preset);
		if (scenario === null) throw new Error(`preset ${preset} missing`);
		return scenario;
	}

	const session = new SimulationSession(scenarioOf(defaultPreset));
	setContext(sessionKey, session);

	let root = $state<HTMLDivElement | null>(null);
	let stage = $state<RiverStage | null>(null);
	let lastCell = $state<CellRef | null>(null);
	let pendingPreset = $state<LabPresetId | null>(null);
	let confirmOpen = $state(false);

	const currentPreset = $derived(presetOf(session.scenario.id));
	const hasProgress = $derived(session.month > 0 || session.pending.length > 0);

	function openPanel(cell: CellRef): void {
		lastCell = cell;
		session.selection = cell;
	}

	function closePanel(): void {
		session.selection = null;
		if (lastCell !== null) stage?.focusCell(lastCell);
	}

	function requestPreset(preset: LabPresetId): void {
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
		<div class="flex items-center gap-2">
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
			</select>
		</div>
	</div>

	<div
		class="grid gap-4 lg:grid-cols-[15rem_minmax(0,1fr)_19rem] xl:grid-cols-[17rem_minmax(0,1fr)_21rem]"
	>
		<aside
			aria-label={lab.paletteTitle}
			class="rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-3"
		>
			<h2 class="mb-2 text-lg">{lab.paletteTitle}</h2>
			<Toolbox />
		</aside>

		<section
			id={stageSectionId}
			tabindex="-1"
			aria-label={lab.stageRegion}
			class="max-w-fit focus-visible:outline-offset-4"
		>
			<RiverStage bind:this={stage} onactivate={openPanel} />
		</section>

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
		</aside>

		<section
			id={timeSectionId}
			tabindex="-1"
			aria-label={lab.timeRegion}
			class="focus-visible:outline-offset-4 lg:col-span-3"
		>
			<TimeControls />
		</section>
	</div>
</div>

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
		{pendingPreset === null ? '' : presetNames[pendingPreset]}
	</p>
</Dialog>
