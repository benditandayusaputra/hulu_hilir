<svelte:options namespace="svg" />

<script lang="ts">
	import { seaPath, shorePath as shore } from '$lib/world/layout';
	import { outlineLarge, props, worldPalette as p } from './art/symbols';

	const palms: [number, number][] = [
		[3000, 2215],
		[3420, 2055],
		[3860, 1985]
	];
</script>

<path d={shore} fill="none" stroke={p.sand} stroke-width="150" stroke-linecap="round" />
<path d={shore} fill="none" stroke={p.sandWet} stroke-width="50" stroke-linecap="round" />
<path d={seaPath} fill="url(#world-sea-water)" />
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
