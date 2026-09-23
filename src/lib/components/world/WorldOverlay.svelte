<svelte:options namespace="svg" />

<script lang="ts">
	import { floodLevelOf } from '$lib/components/river/visuals';
	import { segmentNames } from '$lib/content/lab';
	import type { SegmentIndex, SegmentState } from '$lib/sim';
	import type { DetailLevel } from '$lib/world/camera';
	import { RIVER_WIDTH } from '$lib/world/constants';
	import { segmentLayout } from '$lib/world/layout';
	import { FLOOD_SPREAD, type WorldEffect } from '$lib/world/scene';
	import { fishSymbols, signboard, waterTones, worldPalette as p } from './art/symbols';

	interface Props {
		segments: readonly SegmentState[];
		level: DetailLevel;
		selectedWater: SegmentIndex | null;
		focusedWater: SegmentIndex | null;
		effects: readonly WorldEffect[];
	}

	let { segments, level, selectedWater, focusedWater, effects }: Props = $props();

	const W = RIVER_WIDTH;
	const FLOOD_MINIMUM = 0.25;
	const BADGE_RADIUS = 56;
	const DUST_PUFFS = [
		[-40, -18],
		[-18, -34],
		[10, -38],
		[34, -20],
		[44, 4]
	];
	const plankInk = '#FFF4DC';
	const glow = '#FFD84D';

	const reaches = $derived(
		segments.map((segment) => ({
			segment,
			layout: segmentLayout(segment.index),
			tone: waterTones[segment.status],
			flood:
				segment.floodStatus === 'minor' || segment.floodStatus === 'major'
					? Math.max(FLOOD_MINIMUM, floodLevelOf(segment.floodRatio))
					: 0
		}))
	);
	const far = $derived(level === 'far');
</script>

<g pointer-events="none">
	{#each reaches as reach (reach.segment.index)}
		<path
			d={reach.layout.path}
			fill="none"
			stroke={p.outline}
			stroke-linecap="butt"
			stroke-width={W + reach.flood * FLOOD_SPREAD + 8}
			opacity={reach.flood > 0 ? 0.3 : 0}
			class="world-flood"
		/>
		<path
			d={reach.layout.path}
			fill="none"
			stroke={reach.tone.mid}
			stroke-linecap="butt"
			stroke-width={W + reach.flood * FLOOD_SPREAD}
			opacity={reach.flood > 0 ? 0.5 : 0}
			class="world-flood"
		/>
	{/each}

	{#each reaches as reach (reach.segment.index)}
		{@const index = reach.segment.index}
		{#if selectedWater === index || focusedWater === index}
			<path
				d={reach.layout.path}
				fill="none"
				stroke={p.outline}
				stroke-width={W + 40}
				opacity="0.35"
			/>
			<path
				d={reach.layout.path}
				fill="none"
				stroke={selectedWater === index ? glow : p.foam}
				stroke-width={W + 28}
				stroke-dasharray={selectedWater === index ? undefined : '30 18'}
				opacity="0.45"
			/>
		{/if}
	{/each}

	{#each reaches as reach (reach.segment.index)}
		{@const board = reach.layout.board}
		<use
			href="#{signboard.id}"
			x={board.x - signboard.width / 2}
			y={board.y - 56}
			width={signboard.width}
			height={signboard.height}
		/>
		<text
			x={board.x}
			y={board.y - 17}
			class="world-label"
			font-size="17"
			fill={plankInk}
			stroke={p.outline}
			stroke-width="4">{segmentNames[reach.segment.index]}</text
		>
		{#if far}
			<text
				x={board.x}
				y={board.y - 120}
				class="world-label"
				font-size="76"
				fill={plankInk}
				stroke={p.outline}
				stroke-width="12">{reach.segment.index}. {segmentNames[reach.segment.index]}</text
			>
			<circle
				cx={reach.layout.anchor.x}
				cy={reach.layout.anchor.y}
				r={BADGE_RADIUS}
				fill={reach.tone.mid}
				stroke={p.outline}
				stroke-width="9"
			/>
			{#if reach.segment.status !== 'good'}
				<circle
					cx={reach.layout.anchor.x}
					cy={reach.layout.anchor.y}
					r={BADGE_RADIUS - 6}
					fill="url(#world-water-pattern-{reach.segment.status})"
				/>
			{/if}
			<circle
				cx={reach.layout.anchor.x}
				cy={reach.layout.anchor.y}
				r={BADGE_RADIUS - 10}
				fill="none"
				stroke={reach.tone.rim}
				stroke-width="6"
			/>
		{/if}
	{/each}

	{#each effects as effect (effect.id)}
		{#if effect.kind === 'dust'}
			{#each DUST_PUFFS as [dx, dy], order (order)}
				<circle
					cx={effect.x + (dx ?? 0) * 0.3}
					cy={effect.y}
					r="14"
					fill={p.sand}
					stroke={p.outline}
					stroke-width="2"
					class="world-dust"
					style:--dx="{dx}px"
					style:--dy="{dy}px"
				/>
			{/each}
		{:else if effect.kind === 'cash'}
			<text
				x={effect.x}
				y={effect.y}
				class="world-label world-cash"
				font-size="34"
				fill={plankInk}
				stroke={p.outline}
				stroke-width="7">{effect.text}</text
			>
		{:else}
			<g transform="translate({effect.x} {effect.y}) scale({effect.flow === 1 ? -1.6 : 1.6} 1.6)">
				<use
					href="#{fishSymbols.sensitive.id}"
					x={-fishSymbols.sensitive.width / 2}
					y={-fishSymbols.sensitive.height / 2}
					width={fishSymbols.sensitive.width}
					height={fishSymbols.sensitive.height}
					class="world-jump"
				/>
			</g>
			<ellipse
				cx={effect.x}
				cy={effect.y + 12}
				rx="30"
				ry="8"
				fill="none"
				stroke={p.foam}
				stroke-width="4"
				class="world-splash"
			/>
		{/if}
	{/each}
</g>
