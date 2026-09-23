<svelte:options namespace="svg" />

<script lang="ts">
	import Cylinder from './Cylinder.svelte';
	import Prism from './Prism.svelte';
	import { outlineLarge, outlineSmall, wasteBank, worldPalette as p, worldStroke } from './symbols';

	const bins = [
		{ cx: 138, base: 150, body: '#4E9A4A', shade: '#3A7A38', lid: '#6CB66A' },
		{ cx: 162, base: 146, body: '#E8B936', shade: '#C99A1E', lid: '#F4D26A' },
		{ cx: 186, base: 150, body: p.roof, shade: p.roofDark, lid: p.roofLight }
	];
	const binSize = { r: 10, height: 22 };
	const opening = '#5A3A22';
	const planks = [40, 50, 60, 70, 80, 90, 100, 110];
	const corrugation = [30, 42, 54, 66, 78, 90, 102, 114];
	const bottles = [p.waterLight, p.grassMid, '#F2C94C', p.roof];
</script>

<symbol id={wasteBank.id} viewBox="0 0 {wasteBank.width} {wasteBank.height}">
	<ellipse cx="112" cy="152" rx="96" ry="15" fill="url(#world-shadow)" />
	<Prism
		x={30}
		base={126}
		width={90}
		height={52}
		deep={50}
		front={p.wood}
		side={p.woodDark}
		top={p.wood}
	/>
	<g fill="none" stroke={p.woodDark} stroke-width={worldStroke.small}>
		{#each planks as x (x)}
			<path d="M{x} 76 L{x} 124" />
		{/each}
	</g>
	<rect x="40" y="90" width="22" height="36" fill={opening} {...outlineSmall} />
	<rect x="74" y="88" width="34" height="16" fill={opening} {...outlineSmall} />
	{#each bottles as color, index (index)}
		<rect x={78 + index * 7} y="94" width="5" height="10" rx="2" fill={color} {...outlineSmall} />
	{/each}
	<path d="M70 106 L112 106" fill="none" {...outlineLarge} />
	<path d="M20 78 L130 78 L162 56 L52 56 Z" fill={p.stoneLight} {...outlineLarge} />
	<g fill="none" stroke={p.stone} stroke-width={worldStroke.small}>
		{#each corrugation as x (x)}
			<path d="M{x} 76 L{x + 30} 58" />
		{/each}
	</g>
	<path d="M20 78 L130 78 L130 83 L20 83 Z" fill={p.stone} {...outlineSmall} />
	<path d="M130 78 L162 56 L162 61 L130 83 Z" fill={p.stoneDark} {...outlineSmall} />

	<path d="M8 140 C4 124 14 114 26 114 C38 114 44 124 40 140 Z" fill="#E9DDBF" {...outlineSmall} />
	<path
		d="M14 116 L12 108 M22 114 L22 106 M32 116 L35 108"
		fill="none"
		stroke={p.outline}
		stroke-width="6"
		stroke-linecap="round"
	/>
	<path
		d="M14 116 L12 108"
		fill="none"
		stroke={p.waterLight}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path
		d="M22 114 L22 106"
		fill="none"
		stroke={p.grassMid}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path
		d="M32 116 L35 108"
		fill="none"
		stroke="#F2C94C"
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path d="M10 124 Q24 128 38 124" fill="none" stroke={p.wood} stroke-width={worldStroke.small} />

	{#each bins as bin (bin.cx)}
		<Cylinder
			cx={bin.cx}
			base={bin.base}
			{...binSize}
			body={bin.body}
			shade={bin.shade}
			top={bin.lid}
			small
		/>
		<path
			d="M{bin.cx - 4} {bin.base - binSize.height - 1} L{bin.cx + 4} {bin.base -
				binSize.height -
				1}"
			fill="none"
			{...outlineSmall}
		/>
		<path
			d="M{bin.cx - 5} {bin.base - 8} L{bin.cx + 3} {bin.base - 8}"
			fill="none"
			stroke={p.smokeLight}
			stroke-width={worldStroke.small}
			stroke-linecap="round"
			opacity="0.7"
		/>
	{/each}
</symbol>
