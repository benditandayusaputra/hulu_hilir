<svelte:options namespace="svg" />

<script lang="ts">
	import Cylinder from './Cylinder.svelte';
	import {
		openLand,
		outlineLarge,
		outlineSmall,
		tuftPath,
		worldPalette as p,
		worldStroke
	} from './symbols';

	const patch =
		'M20 78 C18 48 60 30 110 32 C160 30 204 46 202 76 C204 108 160 122 108 120 C60 122 22 108 20 78 Z';
	const stumps = [
		{ cx: 150, base: 66, r: 8, height: 9 },
		{ cx: 70, base: 76, r: 7, height: 8 },
		{ cx: 128, base: 102, r: 6, height: 7 }
	];
	const stumpTop = '#D9A866';
	const tufts: [number, number][] = [
		[100, 70],
		[176, 108],
		[36, 64],
		[86, 108]
	];
	const pebbles: [number, number][] = [
		[112, 54],
		[164, 84],
		[58, 62]
	];
</script>

<symbol id={openLand.id} viewBox="0 0 {openLand.width} {openLand.height}">
	<ellipse cx="116" cy="118" rx="96" ry="14" fill="url(#world-shadow)" />
	<path d={patch} transform="translate(0 5)" fill={p.soilWet} {...outlineLarge} />
	<path d={patch} fill={p.soil} {...outlineLarge} />
	<ellipse cx="96" cy="94" rx="18" ry="6" fill={p.soilWet} opacity="0.6" />
	<ellipse cx="170" cy="62" rx="12" ry="4" fill={p.soilWet} opacity="0.6" />
	<ellipse cx="48" cy="100" rx="7" ry="4.5" fill={p.stone} {...outlineSmall} />
	<ellipse cx="46" cy="98.5" rx="3" ry="1.5" fill={p.stoneLight} />
	<ellipse cx="184" cy="92" rx="5" ry="3.5" fill={p.stone} {...outlineSmall} />
	{#each pebbles as [x, y] (x)}
		<ellipse cx={x} cy={y} rx="2.6" ry="1.8" fill={p.stoneLight} {...outlineSmall} />
	{/each}
	{#each stumps as stump (stump.cx)}
		<Cylinder {...stump} body={p.wood} shade={p.woodDark} top={stumpTop} small />
		<ellipse
			cx={stump.cx}
			cy={stump.base - stump.height}
			rx={stump.r * 0.5}
			ry={stump.r * 0.19}
			fill="none"
			stroke={p.wood}
			stroke-width={worldStroke.small}
		/>
	{/each}
	<path d={tufts.map(([x, y]) => tuftPath(x, y)).join(' ')} fill={p.grassDark} />
</symbol>
