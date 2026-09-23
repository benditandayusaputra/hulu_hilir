<svelte:options namespace="svg" />

<script lang="ts">
	import Prism from './Prism.svelte';
	import RoundCluster from './RoundCluster.svelte';
	import {
		beach,
		city,
		hills,
		mountains,
		outlineLarge,
		outlineSmall,
		sea,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	interface Peak {
		shape: string;
		shade: string;
		fill: string;
		shadeFill: string;
	}

	const backPeaks: Peak[] = [
		{
			shape: 'M60 232 C100 170 150 80 200 42 Q214 32 228 42 C280 90 340 170 400 232 Z',
			shade: 'M214 36 Q222 36 228 42 C280 90 340 170 400 232 L252 232 C244 170 234 90 214 36 Z',
			fill: '#8FB5AB',
			shadeFill: '#789F95'
		},
		{
			shape: 'M250 242 C300 170 350 100 394 76 Q408 68 420 78 C460 120 490 180 515 242 Z',
			shade: 'M408 72 Q415 72 420 78 C460 120 490 180 515 242 L432 242 C426 170 420 110 408 72 Z',
			fill: '#86AFA0',
			shadeFill: '#6F988A'
		}
	];

	const frontPeak: Peak = {
		shape: 'M5 258 C40 200 90 140 130 116 Q146 106 160 116 C200 160 240 210 275 258 Z',
		shade: 'M146 110 Q153 110 160 116 C200 160 240 210 275 258 L182 258 C174 200 162 150 146 110 Z',
		fill: '#6E9E6A',
		shadeFill: '#5A8757'
	};

	const mist = '#F4F7F2';
	const woods: Circle[][] = [
		[
			{ x: 60, y: 238, r: 8 },
			{ x: 72, y: 233, r: 9, lit: true },
			{ x: 84, y: 239, r: 7 }
		],
		[
			{ x: 118, y: 242, r: 9, lit: true },
			{ x: 132, y: 245, r: 7 }
		],
		[
			{ x: 200, y: 236, r: 8, lit: true },
			{ x: 212, y: 240, r: 7 }
		]
	];

	const hillTrees: Circle[][] = [
		[
			{ x: 90, y: 96, r: 9, lit: true },
			{ x: 104, y: 99, r: 7 }
		],
		[
			{ x: 330, y: 80, r: 9, lit: true },
			{ x: 344, y: 84, r: 7 }
		],
		[{ x: 392, y: 84, r: 8, lit: true }],
		[{ x: 40, y: 140, r: 8, lit: true }]
	];
	const terrace = '#B7D46A';

	const cityFronts = ['#C9D3D8', '#E6DCC8', '#B9C8D6', '#D8CFC0', '#C4D2C9'];
	const citySides = ['#A4B2B9', '#C7BBA4', '#94A6B6', '#B9AE9C', '#A2B3A8'];
	const cityTops = ['#DDE4E7', '#F1EADB', '#D2DDE6', '#E8E1D5', '#D9E3DC'];

	interface Building {
		x: number;
		base: number;
		width: number;
		height: number;
		deep: number;
	}

	const buildings: Building[] = [
		{ x: 20, base: 170, width: 50, height: 110, deep: 26 },
		{ x: 90, base: 170, width: 44, height: 150, deep: 24 },
		{ x: 150, base: 170, width: 56, height: 90, deep: 28 },
		{ x: 226, base: 170, width: 40, height: 130, deep: 22 },
		{ x: 290, base: 170, width: 60, height: 100, deep: 30 },
		{ x: 368, base: 170, width: 46, height: 140, deep: 24 },
		{ x: 428, base: 170, width: 38, height: 80, deep: 20 },
		{ x: 4, base: 222, width: 60, height: 60, deep: 30 },
		{ x: 84, base: 222, width: 50, height: 80, deep: 26 },
		{ x: 160, base: 222, width: 70, height: 56, deep: 30 },
		{ x: 258, base: 222, width: 54, height: 70, deep: 26 },
		{ x: 338, base: 222, width: 60, height: 50, deep: 28 },
		{ x: 418, base: 222, width: 48, height: 66, deep: 24 }
	];
	const dome = { x: 195, base: 166, rx: 20 };
	const cityTrees: Circle[][] = [
		[
			{ x: 70, y: 222, r: 8, lit: true },
			{ x: 80, y: 225, r: 6 }
		],
		[
			{ x: 244, y: 222, r: 8, lit: true },
			{ x: 254, y: 225, r: 6 }
		],
		[{ x: 408, y: 222, r: 7, lit: true }]
	];

	const fronds = [
		'M146 54 C158 38 178 36 194 48 C178 44 162 48 146 54 Z',
		'M146 54 C156 50 176 56 186 74 C172 62 160 58 146 54 Z',
		'M146 54 C136 40 118 36 102 44 C118 42 132 46 146 54 Z',
		'M146 54 C134 56 118 64 110 80 C122 68 134 60 146 54 Z',
		'M146 54 C146 40 152 28 164 22 C156 32 150 42 146 54 Z'
	];
	const palmTrunk = 'M116 130 C118 106 126 80 146 56';
	const trunkRings = 'M114 118 l8 1 M116 106 l8 2 M120 94 l8 2 M125 82 l7 3 M131 71 l7 3';
	const rocks: Circle[] = [
		{ x: 330, y: 36, r: 9, lit: true },
		{ x: 344, y: 40, r: 7 }
	];

	const waves: [number, number][] = [
		[40, 40],
		[120, 30],
		[210, 48],
		[300, 34],
		[70, 90],
		[170, 100],
		[260, 88],
		[350, 104],
		[430, 92],
		[30, 144],
		[130, 150],
		[230, 140],
		[330, 152],
		[420, 140]
	];
</script>

<linearGradient id="world-sea-water" x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color="#1F6FA3" />
	<stop offset="1" stop-color="#3FA8D8" />
</linearGradient>
<pattern id="world-city-windows" width="10" height="12" patternUnits="userSpaceOnUse">
	<rect x="3" y="3" width="4.5" height="6" rx="0.5" fill="#6F8FA0" />
</pattern>

<symbol id={mountains.id} viewBox="0 0 {mountains.width} {mountains.height}">
	{#each backPeaks as peak (peak.fill)}
		<path d={peak.shape} fill={peak.fill} />
		<path d={peak.shade} fill={peak.shadeFill} />
		<path d={peak.shape} fill="none" {...outlineLarge} />
	{/each}
	<ellipse cx="170" cy="150" rx="96" ry="12" fill={mist} opacity="0.85" />
	<ellipse cx="392" cy="176" rx="112" ry="13" fill={mist} opacity="0.85" />
	<path d={frontPeak.shape} fill={frontPeak.fill} />
	<path d={frontPeak.shade} fill={frontPeak.shadeFill} />
	<path d={frontPeak.shape} fill="none" {...outlineLarge} />
	{#each woods as cluster, index (index)}
		<RoundCluster
			circles={cluster}
			base={p.grassDark}
			shade={p.grassShadow}
			highlight={p.grassMid}
			stroke={worldStroke.small}
		/>
	{/each}
	<ellipse cx="300" cy="214" rx="150" ry="11" fill={mist} opacity="0.85" />
</symbol>

<symbol id={hills.id} viewBox="0 0 {hills.width} {hills.height}">
	<path
		d="M0 150 C60 70 150 50 230 90 C290 60 380 50 460 110 L460 190 L0 190 Z"
		fill={p.grassMid}
		{...outlineLarge}
	/>
	{#each hillTrees.slice(0, 3) as cluster, index (index)}
		<RoundCluster
			circles={cluster}
			base={p.grassDark}
			shade={p.grassShadow}
			highlight={p.grassMid}
			stroke={worldStroke.small}
		/>
	{/each}
	<path
		d="M0 190 L0 130 C60 100 140 104 210 150 C240 170 250 180 256 190 Z"
		fill={p.grassLight}
		{...outlineLarge}
	/>
	<path d="M170 190 C220 130 320 100 460 140 L460 190 Z" fill={terrace} />
	<path
		d="M196 190 C238 146 320 124 460 158 L460 172 C330 142 250 160 220 190 Z"
		fill={p.grassLight}
	/>
	<path
		d="M184 190 C228 138 320 112 460 148 M208 190 C246 152 326 132 460 164 M236 190 C268 166 336 150 460 180"
		fill="none"
		stroke={p.grassDark}
		stroke-width={worldStroke.small}
	/>
	<path d="M170 190 C220 130 320 100 460 140" fill="none" {...outlineLarge} />
	{#each hillTrees.slice(3) as cluster, index (index)}
		<RoundCluster
			circles={cluster}
			base={p.grassDark}
			shade={p.grassShadow}
			highlight={p.grassMid}
			stroke={worldStroke.small}
		/>
	{/each}
</symbol>

<symbol id={city.id} viewBox="0 0 {city.width} {city.height}">
	{#each buildings as building, index (index)}
		{@const tone = index % cityFronts.length}
		{#if index === 7}
			<path
				d="M{dome.x - dome.rx} {dome.base} A{dome.rx} {dome.rx * 1.1} 0 0 1 {dome.x +
					dome.rx} {dome.base} Z"
				fill="#5FB0A8"
				{...outlineLarge}
			/>
			<path
				d="M{dome.x} {dome.base - dome.rx * 1.1} L{dome.x} {dome.base - dome.rx * 1.1 - 10}"
				fill="none"
				{...outlineSmall}
			/>
		{/if}
		<Prism
			{...building}
			front={cityFronts[tone] ?? p.stoneLight}
			side={citySides[tone] ?? p.stone}
			top={cityTops[tone] ?? p.stoneLight}
		/>
		<rect
			x={building.x + 4}
			y={building.base - building.height + 6}
			width={building.width - 8}
			height={building.height - 16}
			fill="url(#world-city-windows)"
		/>
	{/each}
	{#each cityTrees as cluster, index (index)}
		<RoundCluster
			circles={cluster}
			base={p.grassMid}
			shade={p.grassShadow}
			highlight={p.grassLight}
			stroke={worldStroke.small}
		/>
	{/each}
</symbol>

<symbol id={beach.id} viewBox="0 0 {beach.width} {beach.height}">
	<rect width={beach.width} height={beach.height} fill={p.sand} />
	<path d="M0 0 L250 0 C210 26 130 46 0 64 Z" fill={p.grassLight} />
	<path d="M250 0 C210 26 130 46 0 64" fill="none" {...outlineLarge} />
	<path d="M420 50 C368 88 276 128 160 170" fill="none" stroke={p.sandWet} stroke-width="16" />
	<path d="M420 58 C370 94 282 134 172 170 L420 170 Z" fill="url(#world-sea-water)" />
	<path
		d="M420 58 C370 94 282 134 172 170"
		fill="none"
		stroke={p.foam}
		stroke-width="6"
		stroke-linecap="round"
	/>
	<path d="M420 58 C370 94 282 134 172 170" fill="none" {...outlineLarge} />
	<path
		d="M420 90 C392 112 350 132 300 152"
		fill="none"
		stroke={p.foam}
		stroke-width={worldStroke.large}
		stroke-linecap="round"
		opacity="0.8"
	/>
	<ellipse cx="136" cy="134" rx="30" ry="6" fill="url(#world-shadow)" />
	<path d={palmTrunk} fill="none" stroke={p.outline} stroke-width="12" stroke-linecap="round" />
	<path d={palmTrunk} fill="none" stroke={p.wood} stroke-width="6" stroke-linecap="round" />
	<path
		d={trunkRings}
		fill="none"
		stroke={p.woodDark}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	{#each fronds as frond, index (index)}
		<path d={frond} fill={index % 2 === 0 ? p.grassMid : p.grassDark} {...outlineSmall} />
	{/each}
	<circle cx="142" cy="58" r="3.5" fill={p.woodDark} {...outlineSmall} />
	<circle cx="149" cy="60" r="3.5" fill={p.woodDark} {...outlineSmall} />
	<RoundCluster circles={rocks} base={p.stone} shade={p.stoneDark} highlight={p.stoneLight} />
</symbol>

<symbol id={sea.id} viewBox="0 0 {sea.width} {sea.height}">
	<rect width={sea.width} height={sea.height} fill="url(#world-sea-water)" />
	<g
		fill="none"
		stroke={p.foam}
		stroke-width={worldStroke.large}
		stroke-linecap="round"
		opacity="0.85"
	>
		{#each waves as [x, y] (`${x}-${y}`)}
			<path d="M{x} {y} q6 -4 12 0 t12 0 t12 0" />
		{/each}
	</g>
	<ellipse cx="404" cy="42" rx="42" ry="11" fill={p.sand} {...outlineLarge} />
	<ellipse cx="398" cy="36" rx="26" ry="7" fill={p.grassMid} {...outlineSmall} />
	<path
		d="M404 36 C404 28 406 22 410 18"
		fill="none"
		stroke={p.outline}
		stroke-width="7"
		stroke-linecap="round"
	/>
	<path
		d="M404 36 C404 28 406 22 410 18"
		fill="none"
		stroke={p.wood}
		stroke-width="3"
		stroke-linecap="round"
	/>
	<path
		d="M410 18 C418 12 428 14 432 20 C424 18 416 18 410 18 Z M410 18 C404 10 394 10 388 16 C396 15 404 16 410 18 Z"
		fill={p.grassMid}
		{...outlineSmall}
	/>
</symbol>
