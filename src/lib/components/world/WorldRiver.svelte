<svelte:options namespace="svg" />

<script lang="ts">
	import { flowDurationSeconds } from '$lib/components/river/visuals';
	import type { SegmentState } from '$lib/sim';
	import { intersects, type DetailLevel, type Rect } from '$lib/world/camera';
	import { RIVER_WIDTH } from '$lib/world/constants';
	import type { ResolvedDetail } from '$lib/world/detail';
	import { reachPoint, riverPath, segmentLayout } from '$lib/world/layout';
	import { waterItemsOf, type Placed, type WaterItem } from '$lib/world/scene';
	import { waterTones, worldPalette as p, worldStroke } from './art/symbols';

	interface Props {
		segments: readonly SegmentState[];
		bank: readonly Placed[];
		level: DetailLevel;
		cull: Rect;
		detail: ResolvedDetail;
	}

	let { segments, bank, level, cull, detail }: Props = $props();

	const W = RIVER_WIDTH;
	const ITEM_BOX = 60;
	const glintShares = [0.12, 0.3, 0.46, 0.63, 0.8, 0.93];
	const glintLaterals = [-30, 22, -8, 34, -24, 10];

	const showDetail = $derived(level !== 'far');
	const animate = $derived(level === 'near' && detail === 'full');

	const reaches = $derived(
		segments.map((segment) => {
			const layout = segmentLayout(segment.index);
			return {
				segment,
				layout,
				tone: waterTones[segment.status],
				duration: flowDurationSeconds(segment.flow)
			};
		})
	);

	const items = $derived.by((): WaterItem[] => {
		if (!showDetail) return [];
		return segments
			.flatMap((segment) => waterItemsOf(segment, detail))
			.filter((item) =>
				intersects(cull, {
					x: item.x - ITEM_BOX / 2,
					y: item.y - ITEM_BOX / 2,
					width: ITEM_BOX,
					height: ITEM_BOX
				})
			);
	});

	const glints = $derived(
		showDetail
			? reaches
					.filter((reach) => reach.segment.status === 'good' || reach.segment.status === 'light')
					.flatMap((reach) =>
						glintShares
							.filter((_, order) => reach.segment.status === 'good' || order % 2 === 0)
							.map((share, order) => ({
								key: `${reach.segment.index}-${order}`,
								point: reachPoint(reach.layout, share, glintLaterals[order] ?? 0),
								color: reach.tone.rim
							}))
					)
					.filter((glint) =>
						intersects(cull, { x: glint.point.x, y: glint.point.y, width: 16, height: 6 })
					)
			: []
	);

	const visibleBank = $derived(
		showDetail
			? bank.filter((plant) =>
					intersects(cull, { x: plant.x, y: plant.y, width: plant.width, height: plant.height })
				)
			: []
	);

	function motionClass(item: WaterItem): string {
		if (!animate || item.motion === null) return '';
		return item.motion === 'drift' ? 'world-drift world-loop' : 'world-swim world-loop';
	}
</script>

<g fill="none" stroke-linejoin="round">
	<path
		d={riverPath}
		stroke={p.outline}
		stroke-width={W + 34}
		stroke-linecap="round"
		transform="translate(0 -2)"
	/>
	<path
		d={riverPath}
		stroke={p.soil}
		stroke-width={W + 28}
		stroke-linecap="round"
		transform="translate(0 -2)"
	/>
	<path
		d={riverPath}
		stroke={p.soilWet}
		stroke-width={W + 20}
		stroke-linecap="round"
		transform="translate(0 2)"
	/>
	<path
		d={riverPath}
		stroke={p.sand}
		stroke-width={W + 12}
		stroke-linecap="round"
		transform="translate(0 6)"
	/>
	<path d={riverPath} stroke={p.outline} stroke-width={W + 3} stroke-linecap="round" />
	{#each reaches as reach (reach.segment.index)}
		<path
			d={reach.layout.path}
			stroke={reach.tone.mid}
			stroke-width={W - 3}
			stroke-linecap="butt"
			data-water={reach.segment.index}
			class="world-water"
		/>
	{/each}
	<g pointer-events="none">
		<path
			d={riverPath}
			stroke={p.outline}
			stroke-width="14"
			opacity="0.2"
			transform="translate(0 {-W / 2 + 9})"
		/>
		{#each reaches as reach (reach.segment.index)}
			{#if reach.segment.status !== 'good'}
				<path
					d={reach.layout.path}
					stroke="url(#world-water-pattern-{reach.segment.status})"
					stroke-width={W - 6}
					opacity="0.55"
				/>
			{/if}
			<path
				d={reach.layout.path}
				stroke={reach.tone.rim}
				stroke-width={worldStroke.large}
				opacity="0.85"
				transform="translate(0 {W / 2 - 9})"
			/>
			{#if showDetail}
				<path
					d={reach.layout.path}
					stroke={reach.tone.rim}
					stroke-width="4"
					stroke-linecap="round"
					stroke-dasharray="18 72"
					opacity="0.55"
					class="world-flow world-loop"
					style:animation-duration="{reach.duration}s"
				/>
			{/if}
		{/each}
	</g>
</g>

<g pointer-events="none">
	{#each glints as glint (glint.key)}
		<path
			d="M{glint.point.x} {glint.point.y} q4 -3 8 0 t8 0"
			fill="none"
			stroke={glint.color}
			stroke-width={worldStroke.large}
			stroke-linecap="round"
		/>
	{/each}
	{#each items as item (item.key)}
		{#if item.size !== null}
			<use
				href="#{item.href}"
				x={item.x - item.size.width / 2}
				y={item.y - item.size.height / 2}
				width={item.size.width}
				height={item.size.height}
			/>
		{:else}
			<g
				transform="translate({item.x} {item.y}) rotate({item.turn}) scale({item.scale} {Math.abs(
					item.scale
				)})"
			>
				<use href="#{item.href}" class={motionClass(item)} />
			</g>
		{/if}
	{/each}
	{#each visibleBank as plant (plant.key)}
		<use href="#{plant.href}" x={plant.x} y={plant.y} width={plant.width} height={plant.height} />
	{/each}
</g>
