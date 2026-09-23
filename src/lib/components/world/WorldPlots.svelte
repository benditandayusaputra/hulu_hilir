<svelte:options namespace="svg" />

<script lang="ts">
	import type { TileId } from '$lib/sim';
	import type { DetailLevel, Rect } from '$lib/world/camera';
	import { intersects } from '$lib/world/camera';
	import { PLOT_HEIGHT, PLOT_WIDTH } from '$lib/world/constants';
	import type { ResolvedDetail } from '$lib/world/detail';
	import type { BuildRing, Placed, PlotView } from '$lib/world/scene';
	import { plot as plotSymbol, worldPalette as p } from './art/symbols';

	interface Props {
		views: readonly PlotView[];
		structures: readonly Placed[];
		rings: readonly BuildRing[];
		selected: TileId | null;
		focused: TileId | null;
		bouncing: readonly TileId[];
		level: DetailLevel;
		cull: Rect;
		detail: ResolvedDetail;
	}

	let { views, structures, rings, selected, focused, bouncing, level, cull, detail }: Props =
		$props();

	const RING_RADIUS = 30;
	const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
	const SMOKE_PUFFS = [0, 1, 2];

	type Drawable =
		| { kind: 'plot'; key: string; depth: number; view: PlotView }
		| { kind: 'structure'; key: string; depth: number; item: Placed };

	const drawables = $derived(
		[
			...views.map((view): Drawable => ({
				kind: 'plot',
				key: view.id,
				depth: view.center.y,
				view
			})),
			...structures.map((item): Drawable => ({
				kind: 'structure',
				key: item.key,
				depth: item.y + item.height,
				item
			}))
		].sort((a, b) => a.depth - b.depth)
	);

	const smoky = $derived(level === 'near' && detail === 'full');
	const allRings = $derived([...views.flatMap((view) => view.rings), ...rings]);

	function visible(view: PlotView): boolean {
		return intersects(cull, {
			x: view.asset.x,
			y: view.asset.y,
			width: view.asset.width,
			height: view.asset.height + PLOT_HEIGHT
		});
	}
</script>

{#each drawables as drawable (drawable.key)}
	{#if drawable.kind === 'plot'}
		{@const view = drawable.view}
		<g data-plot={view.id} class="world-plot {bouncing.includes(view.id) ? 'world-bounce' : ''}">
			{#if selected === view.id || focused === view.id}
				<ellipse
					cx={view.center.x}
					cy={view.center.y + 6}
					rx={PLOT_WIDTH / 2 + 14}
					ry={PLOT_HEIGHT / 2 + 12}
					fill="none"
					stroke={p.outline}
					stroke-width="14"
				/>
				<ellipse
					cx={view.center.x}
					cy={view.center.y + 6}
					rx={PLOT_WIDTH / 2 + 14}
					ry={PLOT_HEIGHT / 2 + 12}
					fill="none"
					stroke={selected === view.id ? '#FFD84D' : p.foam}
					stroke-width="8"
					stroke-dasharray={selected === view.id ? undefined : '22 14'}
				/>
			{/if}
			<use
				href="#{plotSymbol.id}"
				x={view.center.x - plotSymbol.width / 2}
				y={view.center.y - plotSymbol.height / 2}
				width={plotSymbol.width}
				height={plotSymbol.height}
			/>
			<use
				href="#{view.asset.href}"
				x={view.asset.x}
				y={view.asset.y}
				width={view.asset.width}
				height={view.asset.height}
			/>
			{#each view.props as prop (prop.key)}
				<use href="#{prop.href}" x={prop.x} y={prop.y} width={prop.width} height={prop.height} />
			{/each}
			{#if smoky && view.chimney !== null && visible(view)}
				<g pointer-events="none">
					{#each SMOKE_PUFFS as puff (puff)}
						<circle
							cx={view.chimney.x + 6}
							cy={view.chimney.y - 8}
							r="7"
							fill={p.smoke}
							stroke={p.outline}
							stroke-width="2"
							class="world-smoke world-loop"
							style:animation-delay="{-puff * 1.1}s"
						/>
					{/each}
				</g>
			{/if}
		</g>
	{:else}
		{@const item = drawable.item}
		<use href="#{item.href}" x={item.x} y={item.y} width={item.width} height={item.height} />
	{/if}
{/each}

<g pointer-events="none">
	{#each allRings as ring (ring.key)}
		<circle
			cx={ring.x}
			cy={ring.y}
			r={RING_RADIUS}
			fill={p.foam}
			fill-opacity="0.85"
			stroke={p.outline}
			stroke-width="8"
		/>
		<circle cx={ring.x} cy={ring.y} r={RING_RADIUS} fill="none" stroke={p.stone} stroke-width="4" />
		<circle
			cx={ring.x}
			cy={ring.y}
			r={RING_RADIUS}
			fill="none"
			stroke={p.grassMid}
			stroke-width="5"
			stroke-linecap="round"
			stroke-dasharray="{RING_LENGTH * ring.progress} {RING_LENGTH}"
			transform="rotate(-90 {ring.x} {ring.y})"
			class="world-ring"
		/>
		<path
			d="M{ring.x - 9} {ring.y + 8} L{ring.x + 5} {ring.y - 6} M{ring.x + 1} {ring.y -
				10} L{ring.x + 9} {ring.y - 2}"
			fill="none"
			stroke={p.outline}
			stroke-width="4"
			stroke-linecap="round"
		/>
	{/each}
</g>
