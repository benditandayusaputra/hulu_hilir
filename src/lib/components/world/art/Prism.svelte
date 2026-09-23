<svelte:options namespace="svg" />

<script lang="ts">
	import { outlineLarge, prismFaces } from './symbols';

	interface Props {
		x: number;
		base: number;
		width: number;
		height: number;
		deep: number;
		front: string;
		side: string;
		top: string;
	}

	let { x, base, width, height, deep, front, side, top }: Props = $props();

	const faces = $derived(prismFaces(x, base, width, height, deep));
</script>

<path d={faces.side} fill={side} {...outlineLarge} />
<path d={faces.top} fill={top} {...outlineLarge} />
<path d={faces.front} fill={front} {...outlineLarge} />
