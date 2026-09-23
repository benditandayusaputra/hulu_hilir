<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import Tree from './Tree.svelte';
	import {
		forestStages,
		outlineSmall,
		tuftPath,
		worldPalette as p,
		worldStroke,
		type Circle,
		type Trunk
	} from './symbols';

	interface TreeSpec {
		trunk: Trunk;
		canopy: Circle[];
		leaves?: string;
	}

	interface Stage {
		shadow: { cx: number; cy: number; rx: number; ry: number };
		trees: TreeSpec[];
		bush: Circle[];
		tufts: [number, number][];
	}

	const seedlings: [number, number][] = [
		[60, 54],
		[110, 50],
		[160, 56],
		[36, 88],
		[86, 92],
		[136, 86],
		[180, 90]
	];

	const stages: Stage[] = [
		{
			shadow: { cx: 110, cy: 84, rx: 94, ry: 30 },
			trees: [],
			bush: [],
			tufts: [
				[14, 70],
				[186, 60]
			]
		},
		{
			shadow: { cx: 106, cy: 120, rx: 88, ry: 20 },
			trees: [
				{
					trunk: { x: 60, top: 76, bottom: 96, width: 5 },
					canopy: [{ x: 60, y: 68, r: 14, lit: true }]
				},
				{
					trunk: { x: 140, top: 72, bottom: 92, width: 5 },
					canopy: [
						{ x: 140, y: 64, r: 15, lit: true },
						{ x: 151, y: 72, r: 9 }
					]
				},
				{
					trunk: { x: 100, top: 96, bottom: 118, width: 6 },
					canopy: [
						{ x: 100, y: 86, r: 16, lit: true },
						{ x: 88, y: 94, r: 10 }
					]
				},
				{
					trunk: { x: 40, top: 110, bottom: 128, width: 5 },
					canopy: [{ x: 40, y: 102, r: 13, lit: true }]
				},
				{
					trunk: { x: 162, top: 112, bottom: 132, width: 6 },
					canopy: [
						{ x: 162, y: 102, r: 15, lit: true },
						{ x: 172, y: 110, r: 9 }
					]
				}
			],
			bush: [],
			tufts: [
				[12, 134],
				[120, 138],
				[184, 140]
			]
		},
		{
			shadow: { cx: 116, cy: 158, rx: 92, ry: 18 },
			trees: [
				{
					trunk: { x: 62, top: 106, bottom: 138, width: 8 },
					canopy: [
						{ x: 52, y: 92, r: 18 },
						{ x: 70, y: 82, r: 20, lit: true },
						{ x: 72, y: 100, r: 15 }
					],
					leaves: 'M48 100 q4 -4 9 0'
				},
				{
					trunk: { x: 150, top: 100, bottom: 132, width: 8 },
					canopy: [
						{ x: 142, y: 76, r: 20, lit: true },
						{ x: 162, y: 88, r: 17 },
						{ x: 148, y: 98, r: 15 }
					],
					leaves: 'M152 94 q4 -4 9 0'
				},
				{
					trunk: { x: 176, top: 128, bottom: 158, width: 8 },
					canopy: [
						{ x: 168, y: 118, r: 16, lit: true },
						{ x: 186, y: 124, r: 14 }
					]
				},
				{
					trunk: { x: 98, top: 128, bottom: 164, width: 10 },
					canopy: [
						{ x: 84, y: 118, r: 19 },
						{ x: 104, y: 104, r: 22, lit: true },
						{ x: 118, y: 122, r: 17 }
					],
					leaves: 'M80 126 q4 -4 9 0 M108 120 q4 -4 9 0'
				}
			],
			bush: [
				{ x: 134, y: 164, r: 8 },
				{ x: 145, y: 160, r: 10, lit: true },
				{ x: 155, y: 165, r: 7 }
			],
			tufts: [
				[18, 160],
				[192, 166]
			]
		},
		{
			shadow: { cx: 122, cy: 176, rx: 94, ry: 19 },
			trees: [
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
			],
			bush: [
				{ x: 130, y: 172, r: 10 },
				{ x: 143, y: 167, r: 13, lit: true },
				{ x: 157, y: 173, r: 9 }
			],
			tufts: [
				[24, 178],
				[198, 180]
			]
		}
	];
</script>

{#each stages as stage, index (index)}
	{@const size = forestStages[index]}
	{#if size}
		<symbol id={size.id} viewBox="0 0 {size.width} {size.height}">
			<ellipse {...stage.shadow} fill="url(#world-shadow)" />
			<path d={stage.tufts.map(([x, y]) => tuftPath(x, y)).join(' ')} fill={p.grassDark} />
			{#if index === 0}
				{#each seedlings as [x, y] (x)}
					<ellipse cx={x} cy={y} rx="12" ry="5" fill={p.soil} {...outlineSmall} />
					<path
						d="M{x - 8} {y - 1} q8 -4 16 0"
						fill="none"
						stroke={p.soilWet}
						stroke-width={worldStroke.small}
					/>
					<path
						d="M{x} {y - 2} L{x} {y - 13}"
						fill="none"
						stroke={p.grassShadow}
						stroke-width={worldStroke.small}
						stroke-linecap="round"
					/>
					<ellipse
						cx={x - 5}
						cy={y - 14}
						rx="5.5"
						ry="2.8"
						transform="rotate(-25 {x - 5} {y - 14})"
						fill={p.grassMid}
						{...outlineSmall}
					/>
					<ellipse
						cx={x + 5}
						cy={y - 16}
						rx="6"
						ry="3"
						transform="rotate(25 {x + 5} {y - 16})"
						fill={p.grassLight}
						{...outlineSmall}
					/>
				{/each}
			{/if}
			{#each stage.trees as tree, treeIndex (treeIndex)}
				<Tree trunk={tree.trunk} canopy={tree.canopy} leaves={tree.leaves ?? ''} />
			{/each}
			{#if stage.bush.length > 0}
				<RoundCluster
					circles={stage.bush}
					base={p.grassMid}
					shade={p.grassShadow}
					highlight={p.grassLight}
				/>
			{/if}
		</symbol>
	{/if}
{/each}
