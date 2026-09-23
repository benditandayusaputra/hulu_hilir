<script lang="ts">
	import {
		birdEgret,
		birdFlying,
		boat,
		factory,
		fishSymbols,
		forestStages,
		greenbelt,
		hyacinth,
		ipal,
		paddyStages,
		retentionPond,
		riverPieces,
		settlement,
		signboard,
		wasteBank,
		worldPalette,
		type WorldSymbol
	} from '$lib/components/world/art/symbols';

	interface Placement {
		symbol: WorldSymbol;
		x: number;
		y: number;
		turn?: number;
	}

	const width = 1040;
	const height = 600;
	const riverTop = 236;

	const river = [riverPieces.good, riverPieces.good, riverPieces.light, riverPieces.moderate];

	const farBank: Placement[] = [
		{ symbol: settlement, x: 330, y: 50 },
		{ symbol: factory, x: 560, y: 68 },
		{ symbol: forestStages[3], x: 110, y: 78 },
		{ symbol: ipal, x: 790, y: 88 },
		{ symbol: signboard, x: 4, y: 188 }
	];

	const sky: Placement[] = [
		{ symbol: birdFlying, x: 300, y: 18 },
		{ symbol: birdFlying, x: 344, y: 34 }
	];

	const onWater: Placement[] = [
		{ symbol: fishSymbols.sensitive, x: 200, y: 290, turn: -20 },
		{ symbol: boat, x: 420, y: 296 },
		{ symbol: hyacinth, x: 690, y: 314 },
		{ symbol: hyacinth, x: 736, y: 326 },
		{ symbol: birdEgret, x: 280, y: 328 }
	];

	const nearBank: Placement[] = [
		{ symbol: greenbelt, x: 20, y: 300 },
		{ symbol: paddyStages.planted, x: 330, y: 396 },
		{ symbol: wasteBank, x: 590, y: 410 },
		{ symbol: retentionPond, x: 800, y: 420 }
	];

	const layers = [farBank, sky, onWater, nearBank];
</script>

<svg
	aria-hidden="true"
	focusable="false"
	viewBox="0 0 {width} {height}"
	{width}
	{height}
	class="block h-auto max-w-full"
>
	<rect {width} {height} fill={worldPalette.grassLight} />
	{#each river as piece, index (index)}
		<use
			href="#{piece.id}"
			x={index * piece.width}
			y={riverTop}
			width={piece.width}
			height={piece.height}
		/>
	{/each}
	{#each layers as layer, layerIndex (layerIndex)}
		{#each layer as item, index (index)}
			<use
				href="#{item.symbol.id}"
				x={item.x}
				y={item.y}
				width={item.symbol.width}
				height={item.symbol.height}
				transform={item.turn
					? `rotate(${item.turn} ${item.x + item.symbol.width / 2} ${item.y + item.symbol.height / 2})`
					: undefined}
			/>
		{/each}
	{/each}
</svg>
