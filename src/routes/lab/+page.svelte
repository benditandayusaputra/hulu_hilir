<script lang="ts">
	import { setContext } from 'svelte';
	import { page } from '$app/state';
	import RiverStage from '$lib/components/river/RiverStage.svelte';
	import { lab, labPresetIds, type LabPresetId } from '$lib/content/lab';
	import { scenarioById, type Scenario } from '$lib/sim';
	import { sessionKey, SimulationSession } from '$lib/state/simulation.svelte';
	import { shell } from '$lib/state/shell.svelte';

	const defaultPreset: LabPresetId = 'desa';
	const stageSectionId = 'panggung-sungai';
	const timeSectionId = 'kontrol-waktu';

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
		if (preset !== session.scenario.id) session.reset(scenarioOf(preset));
	});
</script>

<svelte:head>
	<title>{lab.pageTitle}</title>
	<meta name="description" content={lab.lead} />
</svelte:head>

<h1 class="text-2xl md:text-3xl">{lab.title}</h1>
<p class="mt-2 max-w-[var(--measure-prose)] text-ink-muted">{lab.lead}</p>

<section
	id={stageSectionId}
	tabindex="-1"
	aria-label={lab.stageRegion}
	class="mt-6 max-w-fit focus-visible:outline-offset-4"
>
	<RiverStage onactivate={(cell) => (session.selection = cell)} />
</section>

<section id={timeSectionId} tabindex="-1" aria-label={lab.timeRegion} class="mt-6"></section>
