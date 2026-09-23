<svelte:options namespace="svg" />

<script lang="ts">
	import { outlineLarge, props, worldPalette as p, worldStroke } from './art/symbols';

	const shore =
		'M2700 3000 L2760 2640 C2800 2420 2980 2270 3200 2180 C3500 2060 3800 2020 4000 2000';
	const sea = `${shore} L4000 3000 Z`;
	const palms: [number, number][] = [
		[3000, 2215],
		[3420, 2055],
		[3860, 1985]
	];
</script>

<defs>
	<clipPath id="world-sea-clip">
		<path d={sea} />
	</clipPath>
	<pattern id="world-sea-waves" width="180" height="110" patternUnits="userSpaceOnUse">
		<path
			d="M20 30 q10 -7 20 0 t20 0 t20 0 M110 84 q10 -7 20 0 t20 0 t20 0"
			fill="none"
			stroke={p.foam}
			stroke-width={worldStroke.large}
			stroke-linecap="round"
			opacity="0.8"
		/>
	</pattern>
</defs>

<path d={shore} fill="none" stroke={p.sand} stroke-width="150" stroke-linecap="round" />
<path d={shore} fill="none" stroke={p.sandWet} stroke-width="50" stroke-linecap="round" />
<path d={sea} fill="url(#world-sea-water)" />
<g clip-path="url(#world-sea-clip)">
	<rect
		x="2520"
		y="1820"
		width="1660"
		height="1360"
		fill="url(#world-sea-waves)"
		class="world-sea world-loop"
	/>
</g>
<path d={shore} fill="none" stroke={p.foam} stroke-width="8" stroke-linecap="round" />
<path d={shore} fill="none" {...outlineLarge} />
{#each palms as [x, bottom] (x)}
	<use
		href="#{props.palm.id}"
		x={x - props.palm.width / 2}
		y={bottom - props.palm.height}
		width={props.palm.width}
		height={props.palm.height}
	/>
{/each}
