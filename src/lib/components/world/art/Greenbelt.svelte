<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import Tree from './Tree.svelte';
	import { greenbelt, tuftPath, worldPalette as p, type Circle, type Trunk } from './symbols';

	const trees: { trunk: Trunk; canopy: Circle[] }[] = [
		{
			trunk: { x: 40, top: 62, bottom: 88, width: 8 },
			canopy: [
				{ x: 34, y: 48, r: 17, lit: true },
				{ x: 50, y: 56, r: 14 }
			]
		},
		{
			trunk: { x: 118, top: 56, bottom: 84, width: 9 },
			canopy: [
				{ x: 110, y: 40, r: 19, lit: true },
				{ x: 128, y: 50, r: 15 }
			]
		},
		{
			trunk: { x: 196, top: 60, bottom: 88, width: 8 },
			canopy: [
				{ x: 188, y: 46, r: 17, lit: true },
				{ x: 206, y: 54, r: 14 }
			]
		},
		{
			trunk: { x: 256, top: 70, bottom: 94, width: 7 },
			canopy: [{ x: 254, y: 58, r: 15, lit: true }]
		}
	];

	const shrubs: Circle[][] = [
		[
			{ x: 18, y: 104, r: 10 },
			{ x: 32, y: 100, r: 12, lit: true },
			{ x: 46, y: 105, r: 9 }
		],
		[
			{ x: 84, y: 102, r: 11, lit: true },
			{ x: 98, y: 106, r: 9 }
		],
		[
			{ x: 150, y: 104, r: 12, lit: true },
			{ x: 165, y: 107, r: 9 }
		],
		[
			{ x: 222, y: 104, r: 11, lit: true },
			{ x: 236, y: 108, r: 9 }
		]
	];
</script>

<symbol id={greenbelt.id} viewBox="0 0 {greenbelt.width} {greenbelt.height}">
	<ellipse cx="146" cy="108" rx="136" ry="20" fill="url(#world-shadow)" />
	{#each trees as tree (tree.trunk.x)}
		<Tree trunk={tree.trunk} canopy={tree.canopy} />
	{/each}
	{#each shrubs as shrub, index (index)}
		<RoundCluster
			circles={shrub}
			base={p.grassMid}
			shade={p.grassShadow}
			highlight={p.grassLight}
		/>
	{/each}
	<path
		d="{tuftPath(64, 118)} {tuftPath(128, 120)} {tuftPath(200, 120)} {tuftPath(262, 118)}"
		fill={p.grassDark}
	/>
</symbol>
