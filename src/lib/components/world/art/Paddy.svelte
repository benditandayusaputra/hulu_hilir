<svelte:options namespace="svg" />

<script lang="ts">
	import {
		outlineLarge,
		outlineSmall,
		paddyStages,
		tuftPath,
		worldPalette as p,
		worldStroke
	} from './symbols';

	interface Field {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	const fields: Field[] = [
		{ x: 30, y: 34, w: 180, h: 30 },
		{ x: 16, y: 74, w: 208, h: 32 },
		{ x: 6, y: 116, w: 228, h: 30 }
	];

	const bund = '#D6B77F';
	const rowGap = 8;
	const columnGap = 12;

	const looks = [
		{ symbol: paddyStages.planted, field: '#8FC4A0', crop: p.grassDark, sheaves: false },
		{ symbol: paddyStages.harvest, field: '#E8C65A', crop: '#B8902C', sheaves: true }
	];

	function crops(field: Field): string {
		const marks: string[] = [];
		for (let y = field.y + 11; y < field.y + field.h - 3; y += rowGap) {
			for (let x = field.x + 14; x < field.x + field.w - 10; x += columnGap) {
				marks.push(tuftPath(x - 4, y));
			}
		}
		return marks.join(' ');
	}

	const sheaves: [number, number][] = [
		[64, 132],
		[176, 128]
	];
</script>

{#each looks as look (look.symbol.id)}
	<symbol id={look.symbol.id} viewBox="0 0 {look.symbol.width} {look.symbol.height}">
		<ellipse cx="126" cy="146" rx="114" ry="12" fill="url(#world-shadow)" />
		<g transform="translate(0 10) skewY(-2.5)">
			{#each fields as field (field.y)}
				<rect
					x={field.x}
					y={field.y + field.h - 4}
					width={field.w}
					height="12"
					rx="6"
					fill={p.soilWet}
					{...outlineLarge}
				/>
				<rect
					x={field.x}
					y={field.y}
					width={field.w}
					height={field.h}
					rx="8"
					fill={bund}
					{...outlineLarge}
				/>
				<rect
					x={field.x + 5}
					y={field.y + 4}
					width={field.w - 10}
					height={field.h - 8}
					rx="5"
					fill={look.field}
				/>
				<path d={crops(field)} fill={look.crop} />
			{/each}
			{#if look.sheaves}
				{#each sheaves as [x, y] (x)}
					<path
						d="M{x - 6} {y} L{x - 3} {y - 16} L{x + 3} {y - 16} L{x + 6} {y} Z"
						fill="#F0D27A"
						{...outlineSmall}
					/>
					<path
						d="M{x - 4.5} {y - 8} L{x + 4.5} {y - 8}"
						fill="none"
						stroke={p.roof}
						stroke-width={worldStroke.small}
					/>
				{/each}
			{/if}
		</g>
	</symbol>
{/each}
