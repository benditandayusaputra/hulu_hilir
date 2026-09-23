<script lang="ts">
	import type { WaterStatus } from '$lib/sim';
	import Backdrop from './Backdrop.svelte';
	import Factory from './Factory.svelte';
	import Floodgate from './Floodgate.svelte';
	import Forest from './Forest.svelte';
	import Greenbelt from './Greenbelt.svelte';
	import House from './House.svelte';
	import Ipal from './Ipal.svelte';
	import OpenLand from './OpenLand.svelte';
	import Paddy from './Paddy.svelte';
	import Plot from './Plot.svelte';
	import Props from './Props.svelte';
	import RetentionPond from './RetentionPond.svelte';
	import RiverPiece from './RiverPiece.svelte';
	import Settlement from './Settlement.svelte';
	import Signboard from './Signboard.svelte';
	import WasteBank from './WasteBank.svelte';
	import WaterItems from './WaterItems.svelte';
	import Wildlife from './Wildlife.svelte';
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
		{#each statuses as status (status)}
			<RiverPiece {status} />
		{/each}
		<WaterItems />
		<Wildlife />
		<Plot />
		<Forest />
		<Paddy />
		<House />
		<Settlement />
		<Factory />
		<OpenLand />
		<Ipal />
		<WasteBank />
		<RetentionPond />
		<Greenbelt />
		<Floodgate />
		<Signboard />
		<Backdrop />
		<Props />
	</defs>
</svg>
