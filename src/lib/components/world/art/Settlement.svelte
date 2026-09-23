<svelte:options namespace="svg" />

<script lang="ts">
	import Prism from './Prism.svelte';
	import Tree from './Tree.svelte';
	import {
		denseSettlement,
		depth,
		houseVariants,
		outlineLarge,
		outlineSmall,
		settlement,
		tuftPath,
		worldPalette as p,
		worldStroke
	} from './symbols';

	const houses = [
		{ symbol: houseVariants.mint, x: 0, y: 0 },
		{ symbol: houseVariants.peach, x: 118, y: -4 },
		{ symbol: houseVariants.cream, x: 22, y: 64 },
		{ symbol: houseVariants.mint, x: 132, y: 80 }
	];

	const picketGap = 11;
	const fence = { from: { x: 8, y: 214 }, to: { x: 244, y: 204 } };
	const gate = { from: 108, to: 138 };

	function fenceY(x: number): number {
		const t = (x - fence.from.x) / (fence.to.x - fence.from.x);
		return fence.from.y + (fence.to.y - fence.from.y) * t;
	}

	const pickets: number[] = [];
	for (let x = fence.from.x; x <= fence.to.x; x += picketGap) {
		if (x < gate.from || x > gate.to) pickets.push(x);
	}

	const footpath =
		'M112 230 C114 204 132 186 122 160 C114 140 130 124 126 108 L140 108 C146 126 132 140 140 160 C150 186 134 206 136 230 Z';

	const walls = ['#F6EBD2', '#DDEFD5', '#F7DCC6', '#D6E6F0', '#F3E3A6'];
	const unit = 28;

	interface Block {
		x: number;
		base: number;
		height: number;
		deep: number;
		units: number;
	}

	const blocks: Block[] = [
		{ x: 12, base: 104, height: 48, deep: 30, units: 5 },
		{ x: 40, base: 196, height: 44, deep: 30, units: 5 }
	];

	function roof(block: Block): { slope: string; gable: string } {
		const top = block.base - block.height;
		const right = block.x + block.units * unit;
		const half = { x: (block.deep / 2) * depth.x, y: (block.deep / 2) * depth.y };
		const rise = 10;
		const eave = top + 2;
		const ridge = eave + half.y - rise;
		const back = { x: block.deep * depth.x, y: block.deep * depth.y };
		return {
			slope: `M${block.x - 4} ${eave} L${right + 4} ${eave} L${right + 4 + half.x} ${ridge} L${block.x - 4 + half.x} ${ridge} Z`,
			gable: `M${right} ${top} L${right + back.x} ${top + back.y} L${right + half.x} ${ridge + 1} Z`
		};
	}

	const line = { from: { x: 4, y: 110 }, control: { x: 114, y: 120 }, to: { x: 226, y: 102 } };

	function onLine(x: number): number {
		const t = (x - line.from.x) / (line.to.x - line.from.x);
		return (1 - t) ** 2 * line.from.y + 2 * t * (1 - t) * line.control.y + t ** 2 * line.to.y;
	}

	const laundryColors = [p.roof, p.waterLight, '#F2C94C', '#FFFFFF', p.grassMid];
	const laundry = [34, 58, 86, 116, 146, 176, 202];
</script>

<symbol id={settlement.id} viewBox="0 0 {settlement.width} {settlement.height}">
	<path d={footpath} fill={p.sand} {...outlineSmall} />
	<Tree
		trunk={{ x: 226, top: 70, bottom: 96, width: 8 }}
		canopy={[
			{ x: 220, y: 56, r: 16, lit: true },
			{ x: 233, y: 66, r: 12 }
		]}
	/>
	{#each houses as house, index (index)}
		<use
			href="#{house.symbol.id}"
			x={house.x}
			y={house.y}
			width={house.symbol.width}
			height={house.symbol.height}
		/>
	{/each}
	<path
		d="M{fence.from.x} {fence.from.y - 10} L{gate.from - 4} {fenceY(gate.from) - 10} M{gate.to +
			4} {fenceY(gate.to) - 10} L{fence.to.x} {fence.to.y - 10} M{fence.from.x} {fence.from.y -
			4} L{gate.from - 4} {fenceY(gate.from) - 4} M{gate.to + 4} {fenceY(gate.to) - 4} L{fence.to
			.x} {fence.to.y - 4}"
		fill="none"
		stroke={p.outline}
		stroke-width={worldStroke.small * 3}
		stroke-linecap="round"
	/>
	<path
		d="M{fence.from.x} {fence.from.y - 10} L{gate.from - 4} {fenceY(gate.from) - 10} M{gate.to +
			4} {fenceY(gate.to) - 10} L{fence.to.x} {fence.to.y - 10} M{fence.from.x} {fence.from.y -
			4} L{gate.from - 4} {fenceY(gate.from) - 4} M{gate.to + 4} {fenceY(gate.to) - 4} L{fence.to
			.x} {fence.to.y - 4}"
		fill="none"
		stroke={p.wood}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	{#each pickets as x (x)}
		{@const y = fenceY(x)}
		<path
			d="M{x - 2.5} {y} L{x - 2.5} {y - 14} L{x} {y - 17} L{x + 2.5} {y - 14} L{x + 2.5} {y} Z"
			fill={p.plaster}
			{...outlineSmall}
		/>
	{/each}
	<path d="{tuftPath(20, 226)} {tuftPath(224, 218)}" fill={p.grassDark} />
</symbol>

<symbol id={denseSettlement.id} viewBox="0 0 {denseSettlement.width} {denseSettlement.height}">
	<path d="M0 94 L230 84 L230 156 L0 166 Z" fill={p.stoneLight} />
	<path
		d="M0 118 L230 108 M0 140 L230 130"
		fill="none"
		stroke={p.stone}
		stroke-width={worldStroke.small}
	/>
	{#each blocks as block, blockIndex (blockIndex)}
		{@const top = block.base - block.height}
		{@const shape = roof(block)}
		{#if blockIndex === 1}
			<path
				d="M{line.from.x} {line.from.y + 24} L{line.from.x} {line.from.y - 4}"
				fill="none"
				{...outlineLarge}
			/>
			<path
				d="M{line.to.x} {line.to.y + 26} L{line.to.x} {line.to.y - 4}"
				fill="none"
				{...outlineLarge}
			/>
			<path
				d="M{line.from.x} {line.from.y} Q{line.control.x} {line.control.y} {line.to.x} {line.to.y}"
				fill="none"
				{...outlineSmall}
			/>
			{#each laundry as x, index (x)}
				{@const y = onLine(x)}
				<rect
					x={x - 5}
					{y}
					width="10"
					height={index % 2 === 0 ? 12 : 9}
					rx="1.5"
					fill={laundryColors[index % laundryColors.length]}
					{...outlineSmall}
				/>
			{/each}
		{/if}
		<Prism
			x={block.x}
			base={block.base}
			width={block.units * unit}
			height={block.height}
			deep={block.deep}
			front={walls[0] ?? p.plaster}
			side={p.plasterShade}
			top={p.stoneLight}
		/>
		{#each [...Array(block.units).keys()] as index (index)}
			{@const x = block.x + index * unit}
			{@const wall = walls[(index + blockIndex * 2) % walls.length] ?? p.plaster}
			<rect x={x + 1.5} y={top + 1.5} width={unit - 3} height={block.height - 3} fill={wall} />
			<rect x={x + 7} y={top + 8} width="13" height="10" rx="1" fill={p.glass} {...outlineSmall} />
			<path d="M{x + 7} {top + 13} L{x + 20} {top + 13}" fill="none" {...outlineSmall} />
			{#if index % 2 === 0}
				<path
					d="M{x + 5} {top + 24} L{x + 23} {top + 24} M{x + 8} {top + 19} L{x + 8} {top + 24} M{x +
						14} {top + 19} L{x + 14} {top + 24} M{x + 20} {top + 19} L{x + 20} {top + 24}"
					fill="none"
					{...outlineSmall}
				/>
			{/if}
			<rect
				x={index % 2 === 0 ? x + 4 : x + 15}
				y={block.base - 16}
				width="9"
				height="16"
				rx="1"
				fill={p.wood}
				{...outlineSmall}
			/>
			<rect
				x={index % 2 === 0 ? x + 16 : x + 5}
				y={block.base - 14}
				width="7"
				height="7"
				rx="1"
				fill={p.glassShade}
				{...outlineSmall}
			/>
			{#if index > 0}
				<path d="M{x} {top} L{x} {block.base}" fill="none" {...outlineSmall} />
			{/if}
		{/each}
		<path
			d="M{block.x} {block.base} L{block.x + block.units * unit} {block.base} L{block.x +
				block.units * unit} {top} L{block.x} {top} Z"
			fill="none"
			{...outlineLarge}
		/>
		<path d={shape.gable} fill={p.plasterShade} {...outlineLarge} />
		<path d={shape.slope} fill={p.roof} {...outlineLarge} />
		{#each [...Array(block.units - 1).keys()] as index (index)}
			{@const x = block.x + (index + 1) * unit}
			<path
				d="M{x} {top + 2} L{x + (block.deep / 2) * depth.x} {top +
					2 +
					(block.deep / 2) * depth.y -
					10}"
				fill="none"
				stroke={p.roofDark}
				stroke-width={worldStroke.small}
			/>
		{/each}
	{/each}
	<path d="{tuftPath(8, 212)} {tuftPath(206, 208)}" fill={p.grassDark} />
</symbol>
