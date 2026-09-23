<svelte:options namespace="svg" />

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { WEATHER_FADE_MS } from '$lib/world/constants';
	import type { ResolvedDetail } from '$lib/world/detail';
	import type { RunoffMark } from '$lib/world/weather';

	interface Props {
		visible: boolean;
		marks: readonly RunoffMark[];
		moving: boolean;
		detail: ResolvedDetail;
	}

	let { visible, marks, moving, detail }: Props = $props();

	const muddy = '#8A6239';
</script>

{#if visible}
	<g
		pointer-events="none"
		fill="none"
		stroke-linecap="round"
		data-moving={moving ? '' : undefined}
		transition:fade={{ duration: WEATHER_FADE_MS }}
	>
		{#each marks as mark (mark.key)}
			<path
				d={mark.d}
				stroke={muddy}
				stroke-width={mark.width}
				stroke-dasharray="22 16"
				class={detail === 'full' ? 'world-runoff' : undefined}
			/>
		{/each}
	</g>
{/if}
