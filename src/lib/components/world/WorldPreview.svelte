<script lang="ts">
	import { calendarDateOfMonth, type SimState } from '$lib/sim';
	import { worldRect } from '$lib/world/camera';
	import { WORLD_HEIGHT, WORLD_WIDTH } from '$lib/world/constants';
	import { plotViews, segmentObjects } from '$lib/world/scene';
	import WorldBackdrop from './WorldBackdrop.svelte';
	import WorldOverlay from './WorldOverlay.svelte';
	import WorldPlots from './WorldPlots.svelte';
	import WorldRiver from './WorldRiver.svelte';
	import WorldSea from './WorldSea.svelte';

	interface Props {
		state: SimState;
		class?: string;
	}

	let { state, class: className = '' }: Props = $props();

	const calendarMonth = $derived(
		state.month === 0
			? state.scenario.startDate.month
			: calendarDateOfMonth(state.scenario.startDate, state.month).month
	);
	const views = $derived(plotViews(state, calendarMonth));
	const objects = $derived(segmentObjects(state));
</script>

<svg
	aria-hidden="true"
	focusable="false"
	viewBox="0 0 {WORLD_WIDTH} {WORLD_HEIGHT}"
	data-paused=""
	class="block h-auto w-full {className}"
>
	<WorldBackdrop />
	<WorldRiver
		segments={state.segments}
		bank={objects.bank}
		level="far"
		cull={worldRect}
		detail="light"
	/>
	<WorldSea />
	<WorldPlots
		{views}
		structures={objects.structures}
		rings={objects.rings}
		selected={null}
		focused={null}
		bouncing={[]}
		level="far"
		cull={worldRect}
		detail="light"
	/>
	<WorldOverlay
		segments={state.segments}
		level="far"
		selectedWater={null}
		focusedWater={null}
		effects={[]}
	/>
</svg>
