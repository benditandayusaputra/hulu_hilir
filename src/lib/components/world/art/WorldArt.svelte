<script lang="ts">
	import type { WaterStatus } from '$lib/sim';
	import Factory from './Factory.svelte';
	import ForestMature from './ForestMature.svelte';
	import House from './House.svelte';
	import RiverPiece from './RiverPiece.svelte';
	import WaterItems from './WaterItems.svelte';
	import { worldPalette } from './symbols';

	const statuses: WaterStatus[] = ['good', 'light', 'moderate', 'heavy'];
</script>

<svg
	aria-hidden="true"
	focusable="false"
	width="0"
	height="0"
	class="absolute size-0 overflow-hidden"
>
	<defs>
		<radialGradient id="world-shadow">
			<stop offset="0" stop-color={worldPalette.outline} stop-opacity="0.2" />
			<stop offset="0.7" stop-color={worldPalette.outline} stop-opacity="0.2" />
			<stop offset="1" stop-color={worldPalette.outline} stop-opacity="0" />
		</radialGradient>
		<WaterItems />
		<ForestMature />
		<House />
		<Factory />
		{#each statuses as status (status)}
			<RiverPiece {status} />
		{/each}
	</defs>
</svg>
