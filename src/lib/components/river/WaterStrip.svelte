<script lang="ts">
	import type { SegmentState } from '$lib/sim';
	import {
		fishIconCount,
		floodLevelOf,
		flowDurationSeconds,
		HYACINTH_VISIBLE_COVER,
		litterIconCount,
		waterPatternId
	} from './visuals';

	interface Props {
		segment: SegmentState;
	}

	let { segment }: Props = $props();

	const fishSlots = [
		{ x: 10, y: 18 },
		{ x: 30, y: 36 },
		{ x: 12, y: 54 },
		{ x: 30, y: 72 },
		{ x: 20, y: 88 }
	];
	const particleColumns = [10, 24, 38];
	const particleRows = [0, 1, 2];
	const chevronRows = [20, 50, 80];
	const hyacinthSlots = [
		{ x: 12, y: 30 },
		{ x: 36, y: 46 },
		{ x: 16, y: 66 },
		{ x: 34, y: 84 },
		{ x: 26, y: 12 }
	];
	const litterSlots = [
		{ x: 6, y: 40 },
		{ x: 38, y: 24 },
		{ x: 20, y: 78 },
		{ x: 40, y: 60 }
	];
	const HYACINTH_SLOT_SCALE = 5;

	const fishVisible = $derived(fishSlots.slice(0, fishIconCount(segment.fish)));
	const litterVisible = $derived(litterSlots.slice(0, litterIconCount(segment.litter)));
	const hyacinthVisible = $derived(
		segment.hyacinth >= HYACINTH_VISIBLE_COVER
			? hyacinthSlots.slice(0, Math.max(1, Math.round(segment.hyacinth * HYACINTH_SLOT_SCALE)))
			: []
	);
	const floodLevel = $derived(floodLevelOf(segment.floodRatio));
	const duration = $derived(flowDurationSeconds(segment.flow));
</script>

<div
	aria-hidden="true"
	data-status={segment.status}
	class="size-full overflow-hidden rounded-[var(--radius-control)] text-white"
	style="--water-color: var(--color-water-{segment.status}); --flow-duration: {duration}s"
>
	<svg viewBox="0 0 48 96" preserveAspectRatio="xMidYMid slice" class="block size-full">
		<rect
			width="48"
			height="96"
			style="fill: var(--water-color); transition: fill var(--dur-slow) var(--ease-out)"
		/>
		<rect width="48" height="96" fill="url(#{waterPatternId(segment.status)})" opacity="0.45" />
		<g class="flow-particles" style="--flow-distance: 48px" fill="currentColor" opacity="0.55">
			{#each particleColumns as x, column (x)}
				{#each particleRows as row (row)}
					<circle cx={x} cy={-8 + column * 14 + row * 48} r="2" />
				{/each}
			{/each}
		</g>
		<g class="flow-chevrons" fill="none" stroke="currentColor" stroke-width="2" opacity="0.7">
			{#each chevronRows as y (y)}
				<path d="M18 {y} L24 {y + 6} L30 {y}" />
			{/each}
		</g>
		<g fill="currentColor" opacity="0.9">
			{#each fishVisible as slot, index (index)}
				<g class="fish-swim" style="animation-delay: {-index * 0.7}s">
					<path
						d="M{slot.x} {slot.y} q4 -3.5 8 0 q-4 3.5 -8 0 z M{slot.x + 8} {slot.y} l3.5 -3 v6 z"
					/>
				</g>
			{/each}
		</g>
		<g class="fill-leaf" opacity="0.9">
			{#each hyacinthVisible as slot, index (index)}
				<ellipse cx={slot.x} cy={slot.y} rx="6" ry="4" />
			{/each}
		</g>
		<g class="fill-surface" opacity="0.9">
			{#each litterVisible as slot, index (index)}
				<rect x={slot.x} y={slot.y} width="5" height="4" rx="1" />
			{/each}
		</g>
		<rect
			data-flood-level={floodLevel}
			width="48"
			height="96"
			fill="currentColor"
			opacity="0.35"
			style="transform-origin: 50% 100%; transform: scaleY(0)"
		/>
	</svg>
</div>
