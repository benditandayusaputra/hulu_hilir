<svelte:options namespace="svg" />

<script lang="ts">
	import {
		city,
		forestStages,
		hills,
		houseVariants,
		mountains,
		paddyStages,
		settlement,
		worldPalette as p,
		type WorldSymbol
	} from './art/symbols';
	import { WORLD_HEIGHT, WORLD_WIDTH } from '$lib/world/constants';

	interface Decor {
		symbol: WorldSymbol;
		x: number;
		bottom: number;
	}

	const patches: [number, number, number, number][] = [
		[700, 900, 260, 90],
		[2100, 260, 300, 80],
		[3450, 760, 240, 90],
		[1900, 1210, 280, 70],
		[350, 2700, 320, 100],
		[1250, 2000, 200, 70],
		[3100, 1880, 220, 70],
		[2600, 2820, 180, 60],
		[900, 1250, 220, 60]
	];

	const decor: Decor[] = [
		{ symbol: mountains, x: 230, bottom: 262 },
		{ symbol: mountains, x: 640, bottom: 232 },
		{ symbol: forestStages[2], x: 2980, bottom: 330 },
		{ symbol: forestStages[3], x: 3380, bottom: 300 },
		{ symbol: paddyStages.harvest, x: 3740, bottom: 420 },
		{ symbol: forestStages[1], x: 2220, bottom: 1250 },
		{ symbol: forestStages[3], x: 3110, bottom: 930 },
		{ symbol: houseVariants.mint, x: 3420, bottom: 1080 },
		{ symbol: paddyStages.planted, x: 3170, bottom: 1330 },
		{ symbol: hills, x: 610, bottom: 1900 },
		{ symbol: hills, x: 850, bottom: 2150 },
		{ symbol: forestStages[2], x: 150, bottom: 1960 },
		{ symbol: forestStages[1], x: 520, bottom: 2330 },
		{ symbol: forestStages[2], x: 3060, bottom: 2020 },
		{ symbol: city, x: 3520, bottom: 1920 },
		{ symbol: forestStages[3], x: 260, bottom: 2960 },
		{ symbol: paddyStages.harvest, x: 700, bottom: 2900 },
		{ symbol: settlement, x: 1130, bottom: 2960 },
		{ symbol: houseVariants.peach, x: 2350, bottom: 2960 }
	];
</script>

<rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill={p.grassLight} />
<g fill={p.grassMid} opacity="0.35">
	{#each patches as [cx, cy, rx, ry] (`${cx}-${cy}`)}
		<ellipse {cx} {cy} {rx} {ry} />
	{/each}
</g>
{#each decor as item, index (index)}
	<use
		href="#{item.symbol.id}"
		x={item.x - item.symbol.width / 2}
		y={item.bottom - item.symbol.height}
		width={item.symbol.width}
		height={item.symbol.height}
	/>
{/each}
