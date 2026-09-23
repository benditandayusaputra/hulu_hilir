<svelte:options namespace="svg" />

<script lang="ts">
	import type { WaterStatus } from '$lib/sim';
	import {
		outlineLarge as large,
		outlineSmall as small,
		riverPieces,
		waterItems,
		tuftPath,
		waterTones,
		worldPalette as p,
		worldStroke
	} from './symbols';

	interface Props {
		status: WaterStatus;
	}

	let { status }: Props = $props();

	interface Placed {
		x: number;
		y: number;
		turn?: number;
		scale?: number;
	}

	interface Floater extends Placed {
		href: string;
	}

	const piece = $derived(riverPieces[status]);
	const tone = $derived(waterTones[status]);
	const gradientId = $derived(`world-water-${status}`);

	const lip = 'M0 44 C50 36 90 50 140 42 C190 34 220 38 260 44';
	const farWater = 'M0 58 C50 52 90 64 140 56 C190 48 220 52 260 58';
	const farWaterBack = 'L260 58 C220 52 190 48 140 56 C90 64 50 52 0 58 Z';
	const nearWater = 'M0 128 C60 134 110 122 170 128 C230 134 240 130 260 128';
	const nearRim = 'M0 124 C60 130 110 118 170 124 C230 130 240 126 260 124';
	const sandEdge = 'M0 141 C60 147 110 135 170 141 C230 147 240 143 260 141';

	const tufts: Placed[] = [
		{ x: 20, y: 24 },
		{ x: 96, y: 16 },
		{ x: 170, y: 26 },
		{ x: 232, y: 14 },
		{ x: 30, y: 158 },
		{ x: 124, y: 160 },
		{ x: 214, y: 156 }
	];

	const pebbles: Placed[] = [
		{ x: 26, y: 48 },
		{ x: 122, y: 50 },
		{ x: 204, y: 45 }
	];

	const glints: Record<WaterStatus, Placed[]> = {
		good: [
			{ x: 30, y: 78 },
			{ x: 112, y: 70 },
			{ x: 196, y: 84 },
			{ x: 80, y: 106 },
			{ x: 160, y: 110 },
			{ x: 226, y: 72 }
		],
		light: [
			{ x: 112, y: 72 },
			{ x: 60, y: 104 },
			{ x: 200, y: 96 }
		],
		moderate: [{ x: 128, y: 78 }],
		heavy: []
	};

	const fish: Placed[] = [
		{ x: 70, y: 94 },
		{ x: 150, y: 84, scale: 0.85 },
		{ x: 212, y: 106, scale: 1.1 }
	];

	const specks: Placed[] = [
		{ x: 50, y: 86 },
		{ x: 96, y: 78 },
		{ x: 140, y: 98 },
		{ x: 190, y: 90 },
		{ x: 226, y: 102 },
		{ x: 120, y: 112 }
	];

	const streaks: Placed[] = [
		{ x: 28, y: 76 },
		{ x: 58, y: 110 },
		{ x: 104, y: 84 },
		{ x: 176, y: 114 },
		{ x: 214, y: 80 },
		{ x: 150, y: 72 }
	];

	const sludge: Placed[] = [
		{ x: 60, y: 82, scale: 1.5 },
		{ x: 180, y: 100, scale: 1.3 },
		{ x: 122, y: 70 },
		{ x: 232, y: 78, scale: 0.9 }
	];

	const nearFoam: Placed[] = [
		{ x: 18, y: 128, scale: 0.8 },
		{ x: 64, y: 129, scale: 0.7 },
		{ x: 118, y: 125, scale: 0.8 },
		{ x: 176, y: 128, scale: 0.7 },
		{ x: 232, y: 128, scale: 0.8 }
	];

	const farFoam: Placed[] = [
		{ x: 40, y: 59, scale: 0.7 },
		{ x: 150, y: 58, scale: 0.7 },
		{ x: 236, y: 58, scale: 0.7 }
	];

	const denseScum: Placed[] = [
		{ x: 12, y: 125 },
		{ x: 52, y: 128 },
		{ x: 96, y: 124 },
		{ x: 146, y: 123 },
		{ x: 196, y: 128 },
		{ x: 244, y: 123 },
		{ x: 28, y: 62 },
		{ x: 88, y: 64 },
		{ x: 150, y: 60 },
		{ x: 212, y: 58 }
	];

	const floaters: Record<WaterStatus, Floater[]> = {
		good: [],
		light: [],
		moderate: [
			{ href: waterItems.bottle, x: 68, y: 92, turn: -15 },
			{ href: waterItems.bag, x: 150, y: 104, turn: 8 },
			{ href: waterItems.can, x: 206, y: 80, turn: 25 }
		],
		heavy: [
			{ href: waterItems.bottle, x: 34, y: 108, turn: 12 },
			{ href: waterItems.bottle, x: 196, y: 76, turn: -25 },
			{ href: waterItems.bag, x: 110, y: 94, turn: -6 },
			{ href: waterItems.bag, x: 228, y: 112, turn: 10 },
			{ href: waterItems.can, x: 146, y: 116, turn: 30 },
			{ href: waterItems.can, x: 86, y: 70, turn: -40 },
			{ href: waterItems.deadFish, x: 164, y: 88, turn: -8 },
			{ href: waterItems.deadFish, x: 60, y: 104, turn: 6, scale: -0.9 }
		]
	};

	function place({ x, y, turn = 0, scale = 1 }: Placed): string {
		return `translate(${x} ${y}) rotate(${turn}) scale(${scale} ${Math.abs(scale)})`;
	}
</script>

<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
	<stop offset="0" stop-color={tone.deep} />
	<stop offset="0.5" stop-color={tone.mid} />
	<stop offset="1" stop-color={tone.shallow} />
</linearGradient>

<symbol id={piece.id} viewBox="0 0 {piece.width} {piece.height}">
	<rect width={piece.width} height={piece.height} fill={p.grassLight} />
	<rect y="50" width={piece.width} height="86" fill="url(#{gradientId})" />

	<path d="{lip} {farWaterBack}" fill={p.soil} />
	<path d="M0 52 C50 46 90 58 140 50 C190 42 220 46 260 52 {farWaterBack}" fill={p.soilWet} />
	{#each pebbles as pebble (pebble.x)}
		<ellipse cx={pebble.x} cy={pebble.y} rx="4" ry="2.4" fill={p.stone} {...small} />
	{/each}
	<path
		d="{farWater} L260 67 C220 61 190 57 140 65 C90 73 50 61 0 67 Z"
		fill={p.outline}
		opacity="0.2"
	/>

	{#if status === 'good'}
		{#each fish as item (item.x)}
			<use href="#{waterItems.fishShadow}" transform={place(item)} />
		{/each}
	{/if}

	{#if status === 'light'}
		<g fill={p.foam}>
			{#each specks as speck (speck.x)}
				<circle cx={speck.x} cy={speck.y} r="1.6" />
			{/each}
		</g>
	{/if}

	{#if status === 'moderate'}
		<g stroke={p.murk} stroke-width={worldStroke.small} stroke-linecap="round" opacity="0.45">
			{#each streaks as streak (streak.x)}
				<path d="M{streak.x} {streak.y} l9 -5" />
			{/each}
		</g>
	{/if}

	{#if status === 'heavy'}
		{#each sludge as patch (patch.x)}
			<use href="#{waterItems.sludge}" transform={place(patch)} />
		{/each}
	{/if}

	<g fill="none" stroke={tone.rim} stroke-width={worldStroke.large} stroke-linecap="round">
		{#each glints[status] as glint (glint.x)}
			<path d="M{glint.x} {glint.y} q4 -3 8 0 t8 0" />
		{/each}
	</g>

	{#each floaters[status] as floater, index (index)}
		<ellipse
			cx={floater.x}
			cy={floater.y + 4}
			rx="14"
			ry="3.5"
			fill="none"
			stroke={tone.ripple}
			stroke-width={worldStroke.small}
			opacity="0.7"
		/>
		<use href="#{floater.href}" transform={place(floater)} />
	{/each}

	<path d={nearRim} fill="none" stroke={tone.rim} stroke-width={worldStroke.large} opacity="0.85" />

	<path d="{nearWater} L260 170 L0 170 Z" fill={p.sand} />
	<path
		d="{nearWater} L260 133 C240 135 230 139 170 133 C110 127 60 139 0 133 Z"
		fill={p.sandWet}
	/>
	<path d="{sandEdge} L260 170 L0 170 Z" fill={p.grassLight} />

	<path d={lip} fill="none" {...large} />
	<path d={farWater} fill="none" {...large} />
	<path d={nearWater} fill="none" {...large} />
	<path d={sandEdge} fill="none" {...small} />

	{#if status === 'light'}
		{#each [...nearFoam, ...farFoam] as foam, index (index)}
			<use href="#{waterItems.foam}" transform={place(foam)} />
		{/each}
	{/if}

	{#if status === 'heavy'}
		{#each denseScum as foam, index (index)}
			<use href="#{waterItems.scum}" transform={place(foam)} />
		{/each}
	{/if}

	<path d={tufts.map((tuft) => tuftPath(tuft.x, tuft.y)).join(' ')} fill={p.grassDark} />
</symbol>
