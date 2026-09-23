<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import { cloudShadow, clouds, worldPalette as p, worldStroke, type Circle } from './symbols';

	const puffs: Circle[] = [
		{ x: 120, y: 142, r: 34 },
		{ x: 78, y: 126, r: 46 },
		{ x: 250, y: 146, r: 32 },
		{ x: 288, y: 122, r: 48 },
		{ x: 186, y: 134, r: 44 },
		{ x: 140, y: 92, r: 64, lit: true },
		{ x: 222, y: 84, r: 68, lit: true }
	];

	const fluffy = [
		{ symbol: clouds.white, base: '#FBFDFF', shade: '#D3DFE9', highlight: '#FFFFFF' },
		{ symbol: clouds.grey, base: '#E2E8EE', shade: '#B5C1CC', highlight: '#F3F6F9' }
	];

	const bellyShape =
		'M44 172 C20 172 12 144 30 128 C18 100 44 72 80 82 C84 48 124 28 162 42 C182 10 244 6 266 40 C294 22 338 34 342 70 C376 64 404 92 396 124 C412 142 404 172 378 172 Z';
	const litShape = 'matrix(0.92 0 0 0.92 12.8 3.6)';

	const flat = [
		{ symbol: clouds.rain, base: '#A3B3C6', shade: '#7E90A7', belly: '#6C7F97', lit: '#C0CCDA' },
		{ symbol: clouds.storm, base: '#7C899C', shade: '#5D6A7E', belly: '#4D596B', lit: '#98A5B6' }
	];
	const glints = [
		{ cx: 104, cy: 78, rx: 20, ry: 9 },
		{ cx: 206, cy: 36, rx: 26, ry: 10 },
		{ cx: 318, cy: 64, rx: 16, ry: 7 }
	];
</script>

{#each fluffy as cloud (cloud.symbol.id)}
	<symbol id={cloud.symbol.id} viewBox="0 0 {cloud.symbol.width} {cloud.symbol.height}">
		<RoundCluster
			circles={puffs}
			base={cloud.base}
			shade={cloud.shade}
			highlight={cloud.highlight}
		/>
	</symbol>
{/each}

{#each flat as cloud (cloud.symbol.id)}
	<symbol id={cloud.symbol.id} viewBox="0 0 {cloud.symbol.width} {cloud.symbol.height}">
		<path
			d={bellyShape}
			fill={cloud.shade}
			stroke={p.outline}
			stroke-width={worldStroke.large}
			stroke-linejoin="round"
		/>
		<path d={bellyShape} fill={cloud.base} transform={litShape} />
		<rect x="56" y="152" width="310" height="14" rx="7" fill={cloud.belly} />
		{#each glints as glint (glint.cx)}
			<ellipse
				cx={glint.cx}
				cy={glint.cy}
				rx={glint.rx}
				ry={glint.ry}
				fill={cloud.lit}
				transform="rotate(-20 {glint.cx} {glint.cy})"
			/>
		{/each}
	</symbol>
{/each}

<symbol id={cloudShadow.id} viewBox="0 0 {cloudShadow.width} {cloudShadow.height}">
	<ellipse cx="190" cy="55" rx="186" ry="52" fill="url(#world-shadow)" />
</symbol>
