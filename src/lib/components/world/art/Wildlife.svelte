<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import {
		birdEgret,
		birdFlying,
		boat,
		fishSymbols,
		hyacinth,
		outlineSmall,
		outlineLarge,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const fish = [
		{
			symbol: fishSymbols.sensitive,
			body: 'M4 10 C10 3 24 3 30 8 L37 3 L35 10 L37 17 L30 12 C24 17 10 17 4 10 Z',
			belly: 'M6 11 C12 15 24 15 30 11 C22 12 12 12 6 11 Z',
			fin: 'M15 5 L19 0 L23 5 Z',
			fill: '#8CC3D6',
			bellyFill: '#DDF1F6',
			finFill: '#E07B5F',
			eye: { x: 9, y: 8.5 },
			whiskers: ''
		},
		{
			symbol: fishSymbols.intermediate,
			body: 'M4 12 C8 3 22 2 29 9 L37 4 L35 12 L37 20 L29 15 C22 22 8 21 4 12 Z',
			belly: 'M6 14 C12 19 22 19 28 14 C20 15 12 15 6 14 Z',
			fin: 'M13 5 L18 -1 L24 5 Z',
			fill: '#C9B45E',
			bellyFill: '#EFE5B4',
			finFill: '#D99A3E',
			eye: { x: 9, y: 10 },
			whiskers: ''
		},
		{
			symbol: fishSymbols.tolerant,
			body: 'M5 12 C5 7 12 5 20 6 C28 7 32 9 34 10 L41 5 L40 12 L41 19 L34 14 C28 17 16 18 10 17 C6 16 5 14 5 12 Z',
			belly: 'M7 14 C12 17 24 17 32 13 C24 14 14 15 7 14 Z',
			fin: 'M16 7 L22 1 L26 7 Z',
			fill: '#6E6B5E',
			bellyFill: '#9C9886',
			finFill: '#57544A',
			eye: { x: 10, y: 10 },
			whiskers: 'M6 12 q-3 -3 -4 -7 M6 13 q-3 3 -4 7'
		}
	];

	const hull = 'M6 28 Q12 50 56 50 Q98 50 106 24 Q94 34 56 35 Q16 35 6 28 Z';
	const inside = 'M10 28 Q30 21 56 21 Q90 21 104 24 Q94 34 56 35 Q16 35 10 28 Z';

	const leaves: Circle[] = [
		{ x: 20, y: 34, r: 9 },
		{ x: 32, y: 30, r: 10, lit: true },
		{ x: 44, y: 35, r: 9 },
		{ x: 31, y: 40, r: 8 }
	];

	const blossoms: Circle[] = [
		{ x: 31, y: 14, r: 3.5 },
		{ x: 37, y: 11, r: 3.5, lit: true },
		{ x: 33, y: 7, r: 3 },
		{ x: 38, y: 17, r: 3 }
	];

	const egret = '#FAFAF5';
	const egretShade = '#DCDCD2';
	const beak = '#F2C94C';
	const wing = '#4F5D6B';
	const wingLight = '#7A8997';
</script>

{#each fish as kind (kind.symbol.id)}
	<symbol
		id={kind.symbol.id}
		viewBox="0 0 {kind.symbol.width} {kind.symbol.height}"
		overflow="visible"
	>
		<path d={kind.fin} fill={kind.finFill} {...outlineSmall} />
		<path d={kind.body} fill={kind.fill} />
		<path d={kind.belly} fill={kind.bellyFill} />
		<path d={kind.body} fill="none" {...outlineSmall} />
		{#if kind.whiskers}
			<path d={kind.whiskers} fill="none" {...outlineSmall} />
		{/if}
		<circle cx={kind.eye.x} cy={kind.eye.y} r="1.8" fill={p.outline} />
	</symbol>
{/each}

<symbol id={boat.id} viewBox="0 0 {boat.width} {boat.height}">
	<ellipse
		cx="56"
		cy="50"
		rx="52"
		ry="7"
		fill="none"
		stroke={p.glint}
		stroke-width={worldStroke.large}
		opacity="0.8"
	/>
	<path d={hull} fill={p.wood} />
	<path d="M8 34 Q14 50 56 50 Q98 50 104 30 Q96 42 56 43 Q18 43 8 34 Z" fill={p.woodDark} />
	<path d={inside} fill={p.woodDark} />
	<path
		d="M34 23 L32 34 M58 21 L58 35 M80 22 L82 34"
		fill="none"
		stroke={p.wood}
		stroke-width="5"
	/>
	<path
		d="M34 23 L32 34 M58 21 L58 35 M80 22 L82 34"
		fill="none"
		stroke={p.outline}
		stroke-width={worldStroke.small}
		opacity="0.4"
	/>
	<path d={hull} fill="none" {...outlineLarge} />
	<path d="M10 28 Q30 21 56 21 Q90 21 104 24" fill="none" {...outlineSmall} />
	<path d="M64 29 C66 24 76 24 76 29 C74 32 66 32 64 29 Z" fill="#7C9A86" {...outlineSmall} />
	<path d="M20 38 L96 16" fill="none" stroke={p.outline} stroke-width="7" stroke-linecap="round" />
	<path d="M20 38 L96 16" fill="none" stroke={p.wood} stroke-width="3" stroke-linecap="round" />
	<ellipse
		cx="98"
		cy="15.5"
		rx="6"
		ry="3"
		transform="rotate(-16 98 15.5)"
		fill={p.wood}
		{...outlineSmall}
	/>
</symbol>

<symbol id={hyacinth.id} viewBox="0 0 {hyacinth.width} {hyacinth.height}">
	<ellipse
		cx="32"
		cy="42"
		rx="26"
		ry="4"
		fill="none"
		stroke={p.glint}
		stroke-width={worldStroke.small}
		opacity="0.8"
	/>
	<RoundCluster
		circles={leaves}
		base={p.grassMid}
		shade={p.grassShadow}
		highlight={p.grassLight}
		stroke={worldStroke.small}
	/>
	<path d="M32 30 L35 14" fill="none" stroke={p.outline} stroke-width="6" stroke-linecap="round" />
	<path d="M32 30 L35 14" fill="none" stroke={p.grassMid} stroke-width="2" stroke-linecap="round" />
	<RoundCluster
		circles={blossoms}
		base="#B79BE0"
		shade="#8E6CC7"
		highlight="#E4D6F7"
		stroke={worldStroke.small}
	/>
</symbol>

<symbol id={birdEgret.id} viewBox="0 0 {birdEgret.width} {birdEgret.height}">
	<ellipse cx="20" cy="47" rx="13" ry="3" fill="url(#world-shadow)" />
	<path d="M17 31 L16 47 M22 31 L23 47" fill="none" {...outlineSmall} />
	<path
		d="M27 23 C32 18 23 14 26 8"
		fill="none"
		stroke={p.outline}
		stroke-width="8"
		stroke-linecap="round"
	/>
	<path
		d="M27 23 C32 18 23 14 26 8"
		fill="none"
		stroke={egret}
		stroke-width="4"
		stroke-linecap="round"
	/>
	<path d="M3 23 L10 22 C14 18 24 17 30 21 C34 24 33 30 28 32 C20 35 10 32 3 23 Z" fill={egret} />
	<path d="M9 26 C15 23 23 23 29 27 C24 31 14 31 9 26 Z" fill={egretShade} />
	<path
		d="M3 23 L10 22 C14 18 24 17 30 21 C34 24 33 30 28 32 C20 35 10 32 3 23 Z"
		fill="none"
		{...outlineSmall}
	/>
	<circle cx="27" cy="7" r="4.2" fill={egret} {...outlineSmall} />
	<path d="M30 5.8 L39 7.6 L30 9.2 Z" fill={beak} {...outlineSmall} />
	<circle cx="27.5" cy="6.2" r="1.1" fill={p.outline} />
</symbol>

<symbol id={birdFlying.id} viewBox="0 0 {birdFlying.width} {birdFlying.height}">
	<path d="M22 12 C16 4 8 2 2 4 C8 8 14 12 20 15 Z" fill={wing} {...outlineSmall} />
	<path d="M22 12 C28 4 36 2 42 5 C36 8 30 12 24 15 Z" fill={wingLight} {...outlineSmall} />
	<ellipse cx="22" cy="14" rx="6" ry="3.5" fill={wing} {...outlineSmall} />
	<path d="M27 14 L32 12 L31 16 Z" fill={beak} {...outlineSmall} />
</symbol>
