<svelte:options namespace="svg" />

<script lang="ts">
	import { worldPalette, worldStroke, type Circle } from './symbols';

	interface Props {
		circles: Circle[];
		base: string;
		shade: string;
		highlight?: string;
		stroke?: number;
	}

	let { circles, base, shade, highlight, stroke = worldStroke.large }: Props = $props();

	const shadeOffset = 0.1;
	const shadeShrink = 0.16;
</script>

<g fill={worldPalette.outline} stroke={worldPalette.outline} stroke-width={stroke * 2}>
	{#each circles as circle, index (index)}
		<circle cx={circle.x} cy={circle.y} r={circle.r} />
	{/each}
</g>
<g fill={shade}>
	{#each circles as circle, index (index)}
		<circle cx={circle.x} cy={circle.y} r={circle.r} />
	{/each}
</g>
<g fill={base}>
	{#each circles as circle, index (index)}
		<circle
			cx={circle.x - circle.r * shadeOffset}
			cy={circle.y - circle.r * shadeOffset}
			r={circle.r * (1 - shadeShrink)}
		/>
	{/each}
</g>
{#if highlight}
	<g fill={highlight}>
		{#each circles.filter((circle) => circle.lit) as circle, index (index)}
			{@const cx = circle.x - circle.r * 0.36}
			{@const cy = circle.y - circle.r * 0.4}
			<ellipse
				{cx}
				{cy}
				rx={circle.r * 0.34}
				ry={circle.r * 0.2}
				transform="rotate(-35 {cx} {cy})"
			/>
		{/each}
	</g>
{/if}
