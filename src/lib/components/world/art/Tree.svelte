<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import { outlineLarge, worldPalette as p, worldStroke, type Circle, type Trunk } from './symbols';

	interface Props {
		trunk: Trunk;
		canopy: Circle[];
		leaves?: string;
	}

	let { trunk, canopy, leaves = '' }: Props = $props();

	const left = $derived(trunk.x - trunk.width / 2);
	const right = $derived(trunk.x + trunk.width / 2);
	const flare = $derived(Math.min(4, trunk.width / 3));
	const outline = $derived(
		`M${left} ${trunk.top} C${left} ${trunk.bottom - 12} ${left - 1} ${trunk.bottom - 5} ${left - flare} ${trunk.bottom} L${right + flare} ${trunk.bottom} C${right + 1} ${trunk.bottom - 5} ${right} ${trunk.bottom - 12} ${right} ${trunk.top} Z`
	);
	const shade = $derived(
		`M${trunk.x + 1} ${trunk.top} L${right} ${trunk.top} C${right} ${trunk.bottom - 12} ${right + 1} ${trunk.bottom - 5} ${right + flare} ${trunk.bottom} L${trunk.x + 2} ${trunk.bottom} Z`
	);
</script>

<path d={outline} fill={p.wood} />
<path d={shade} fill={p.woodDark} />
<path d={outline} fill="none" {...outlineLarge} />
<RoundCluster circles={canopy} base={p.grassMid} shade={p.grassShadow} highlight={p.grassLight} />
{#if leaves}
	<path
		d={leaves}
		fill="none"
		stroke={p.grassShadow}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
{/if}
