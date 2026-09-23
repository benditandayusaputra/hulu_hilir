<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import { forestMature, tuftPath, worldPalette as p, worldStroke, type Circle } from './symbols';

	interface Tree {
		trunk: { x: number; top: number; bottom: number; width: number };
		canopy: Circle[];
		leaves: string;
	}

	const trees: Tree[] = [
		{
			trunk: { x: 58, top: 112, bottom: 150, width: 10 },
			canopy: [
				{ x: 46, y: 96, r: 22 },
				{ x: 68, y: 82, r: 25, lit: true },
				{ x: 70, y: 106, r: 19 }
			],
			leaves: 'M40 106 q4 -4 9 1 M62 96 q4 -4 9 0'
		},
		{
			trunk: { x: 152, top: 110, bottom: 146, width: 10 },
			canopy: [
				{ x: 140, y: 76, r: 26, lit: true },
				{ x: 165, y: 90, r: 23 },
				{ x: 147, y: 103, r: 20 }
			],
			leaves: 'M156 100 q4 -4 9 0 M136 88 q4 -4 9 1'
		},
		{
			trunk: { x: 175, top: 138, bottom: 172, width: 11 },
			canopy: [
				{ x: 163, y: 128, r: 21, lit: true },
				{ x: 186, y: 121, r: 20, lit: true },
				{ x: 181, y: 143, r: 16 }
			],
			leaves: 'M170 138 q4 -4 9 0'
		},
		{
			trunk: { x: 94, top: 138, bottom: 177, width: 13 },
			canopy: [
				{ x: 73, y: 124, r: 25 },
				{ x: 99, y: 104, r: 30, lit: true },
				{ x: 121, y: 127, r: 23 },
				{ x: 95, y: 138, r: 21 }
			],
			leaves: 'M66 132 q4 -5 10 1 M108 134 q4 -4 9 0 M92 118 q4 -4 9 0'
		}
	];

	const bush: Circle[] = [
		{ x: 130, y: 172, r: 10 },
		{ x: 143, y: 167, r: 13, lit: true },
		{ x: 157, y: 173, r: 9 }
	];

	function trunkPath({ x, top, bottom, width }: Tree['trunk']): string {
		const left = x - width / 2;
		const right = x + width / 2;
		return `M${left} ${top} C${left} ${bottom - 12} ${left - 1} ${bottom - 5} ${left - 4} ${bottom} L${right + 4} ${bottom} C${right + 1} ${bottom - 5} ${right} ${bottom - 12} ${right} ${top} Z`;
	}

	function trunkShadePath({ x, top, bottom, width }: Tree['trunk']): string {
		const right = x + width / 2;
		return `M${x + 1} ${top} L${right} ${top} C${right} ${bottom - 12} ${right + 1} ${bottom - 5} ${right + 4} ${bottom} L${x + 2} ${bottom} Z`;
	}
</script>

<symbol id={forestMature.id} viewBox="0 0 {forestMature.width} {forestMature.height}">
	<ellipse cx="122" cy="176" rx="94" ry="19" fill="url(#world-shadow)" />
	<path d="{tuftPath(24, 178)} {tuftPath(198, 180)}" fill={p.grassDark} />
	{#each trees as tree, index (index)}
		<path d={trunkPath(tree.trunk)} fill={p.wood} />
		<path d={trunkShadePath(tree.trunk)} fill={p.woodDark} />
		<path
			d={trunkPath(tree.trunk)}
			fill="none"
			stroke={p.outline}
			stroke-width={worldStroke.large}
			stroke-linejoin="round"
		/>
		<RoundCluster
			circles={tree.canopy}
			base={p.grassMid}
			shade={p.grassShadow}
			highlight={p.grassLight}
		/>
		<path
			d={tree.leaves}
			fill="none"
			stroke={p.grassShadow}
			stroke-width={worldStroke.small}
			stroke-linecap="round"
		/>
	{/each}
	<RoundCluster circles={bush} base={p.grassMid} shade={p.grassShadow} highlight={p.grassLight} />
</symbol>
