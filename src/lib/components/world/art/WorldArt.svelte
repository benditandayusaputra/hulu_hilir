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
	import { seaPath } from '$lib/world/layout';
	import { worldPalette, worldStroke } from './symbols';

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
		<pattern id="world-water-pattern-light" width="22" height="22" patternUnits="userSpaceOnUse">
			<circle cx="6" cy="6" r="2.4" fill={worldPalette.foam} />
			<circle cx="17" cy="16" r="2" fill={worldPalette.foam} />
		</pattern>
		<pattern id="world-water-pattern-moderate" width="18" height="18" patternUnits="userSpaceOnUse">
			<path
				d="M-3 21 L21 -3 M-3 3 L3 -3 M15 21 L21 15"
				stroke={worldPalette.murk}
				stroke-width="2.5"
			/>
		</pattern>
		<pattern id="world-water-pattern-heavy" width="16" height="16" patternUnits="userSpaceOnUse">
			<path d="M0 16 L16 0 M0 0 L16 16" stroke="#8C825E" stroke-width="2" />
		</pattern>
		<linearGradient
			id="world-sea-open"
			gradientUnits="userSpaceOnUse"
			x1="0"
			y1="2000"
			x2="0"
			y2="3000"
		>
			<stop offset="0" stop-color="#1F6FA3" />
			<stop offset="1" stop-color="#3FA8D8" />
		</linearGradient>
		<clipPath id="world-sea-clip">
			<path d={seaPath} />
		</clipPath>
		<pattern id="world-sea-waves" width="180" height="110" patternUnits="userSpaceOnUse">
			<path
				d="M20 30 q10 -7 20 0 t20 0 t20 0 M110 84 q10 -7 20 0 t20 0 t20 0"
				fill="none"
				stroke={worldPalette.foam}
				stroke-width={worldStroke.large}
				stroke-linecap="round"
				opacity="0.8"
			/>
		</pattern>
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
