<svelte:options namespace="svg" />

<script lang="ts">
	import { ellipseRatio, outlineLarge, outlineSmall } from './symbols';

	interface Props {
		cx: number;
		base: number;
		r: number;
		height: number;
		body: string;
		shade: string;
		top: string;
		small?: boolean;
	}

	let { cx, base, r, height, body, shade, top, small = false }: Props = $props();

	const shadeStart = 0.4;
	const ry = $derived(r * ellipseRatio);
	const crest = $derived(base - height);
	const shadeX = $derived(cx + r * shadeStart);
	const shadeY = $derived(base + ry * Math.sqrt(1 - shadeStart * shadeStart));
	const outline = $derived(small ? outlineSmall : outlineLarge);
</script>

<path
	d="M{cx - r} {crest} L{cx - r} {base} A{r} {ry} 0 0 0 {cx + r} {base} L{cx + r} {crest} Z"
	fill={body}
/>
<path
	d="M{shadeX} {crest} L{shadeX} {shadeY} A{r} {ry} 0 0 0 {cx + r} {base} L{cx + r} {crest} Z"
	fill={shade}
/>
<path
	d="M{cx - r} {crest} L{cx - r} {base} A{r} {ry} 0 0 0 {cx + r} {base} L{cx + r} {crest}"
	fill="none"
	{...outline}
/>
<ellipse {cx} cy={crest} rx={r} {ry} fill={top} {...outline} />
