<script lang="ts">
	import type { StarLevel } from '$lib/sim';

	interface Props {
		stars: StarLevel | 0;
		label: string;
		size?: number;
	}

	let { stars, label, size = 120 }: Props = $props();

	const slots = [
		{ x: 30, y: 54, scale: 0.8 },
		{ x: 60, y: 46, scale: 1 },
		{ x: 90, y: 54, scale: 0.8 }
	];
	const star =
		'M0 -12 L3.5 -4 L12 -3.7 L5.5 2 L7.5 10.5 L0 6 L-7.5 10.5 L-5.5 2 L-12 -3.7 L-3.5 -4 Z';
</script>

<svg
	role="img"
	aria-label={label}
	viewBox="0 0 120 120"
	width={size}
	height={size}
	class="star-stamp"
>
	<circle
		cx="60"
		cy="60"
		r="54"
		fill="none"
		stroke="currentColor"
		stroke-width="5"
		stroke-dasharray="26 3 9 2 40 3"
	/>
	<circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="2.5" />
	<path d="M24 80 L96 80" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
	<path
		d="M34 88 L86 88"
		stroke="currentColor"
		stroke-width="2.5"
		stroke-linecap="round"
		stroke-dasharray="10 3"
	/>
	{#each slots as slot, index (index)}
		<path
			d={star}
			transform="translate({slot.x} {slot.y}) scale({slot.scale})"
			fill={index < stars ? 'currentColor' : 'none'}
			stroke="currentColor"
			stroke-width="2.5"
			stroke-linejoin="round"
		/>
	{/each}
</svg>

<style>
	.star-stamp {
		color: var(--color-stamp);
		opacity: 0.92;
		transform: rotate(-10deg);
	}
</style>
