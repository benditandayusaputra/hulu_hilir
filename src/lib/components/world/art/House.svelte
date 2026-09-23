<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import {
		houseVariants,
		outlineLarge as large,
		outlineSmall as small,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const shrub: Circle[] = [
		{ x: 12, y: 105, r: 8, lit: true },
		{ x: 20, y: 111, r: 7 }
	];

	const variants = [
		{ symbol: houseVariants.cream, wall: p.plaster, wallShade: p.plasterShade },
		{ symbol: houseVariants.mint, wall: '#DDEFD5', wallShade: '#B7D1AA' },
		{ symbol: houseVariants.peach, wall: '#F7DCC6', wallShade: '#DCB597' }
	];
</script>

{#each variants as { symbol, wall, wallShade } (symbol.id)}
	<symbol id={symbol.id} viewBox="0 0 {symbol.width} {symbol.height}">
		<ellipse cx="68" cy="110" rx="50" ry="12" fill="url(#world-shadow)" />

		<path d="M74 108 L98 93 L98 61 L74 76 Z" fill={wallShade} {...large} />
		<path d="M74 108 L98 93 L98 88 L74 103 Z" fill={p.stoneDark} {...small} />
		<path d="M81 91.5 L91 85.5 L91 74.5 L81 80.5 Z" fill={p.glassShade} {...small} />
		<path d="M81 86 L91 80" fill="none" {...small} />

		<path d="M18 108 L74 108 L74 76 L46 48 L18 76 Z" fill={wall} {...large} />
		<path d="M18 76 L46 48 L74 76 L67 76 L46 56 L25 76 Z" fill={wallShade} />
		<rect x="18" y="103" width="56" height="5" fill={p.stone} {...small} />
		<circle cx="46" cy="66" r="5" fill={p.glass} {...small} />

		<path d="M27 106 L27 88 Q27 82 34 82 Q41 82 41 88 L41 106 Z" fill={p.wood} {...small} />
		<path d="M34 82 Q41 82 41 88 L41 106 L34 106 Z" fill={p.woodDark} />
		<path d="M27 106 L27 88 Q27 82 34 82 Q41 82 41 88 L41 106 Z" fill="none" {...small} />
		<circle cx="38" cy="95" r="1.2" fill={p.outline} />
		<path d="M24 108 L44 108 L46 112 L22 112 Z" fill={p.stoneLight} {...small} />

		<rect x="49" y="84" width="17" height="13" rx="1.5" fill={p.glass} {...small} />
		<path d="M49 91 L66 91 L66 97 L49 97 Z" fill={p.glassShade} />
		<rect x="49" y="84" width="17" height="13" rx="1.5" fill="none" {...small} />
		<path d="M57.5 84 L57.5 97 M49 90.5 L66 90.5" fill="none" {...small} />
		<path d="M47 98 L68 98" fill="none" {...large} />

		<path d="M43 50 L9 84 L39 65 L73 31 Z" fill={p.roofLight} />
		<path d="M43 50 L73 31 L107 65 L77 84 Z" fill={p.roof} />
		<path d="M60 67 L90 48 L107 65 L77 84 Z" fill={p.roofDark} />
		<g fill="none" stroke={p.roofDark} stroke-width={worldStroke.small}>
			<path d="M31.8 61.2 L61.8 42.2 M20.6 72.4 L50.6 53.4" />
		</g>
		<path d="M43 50 L9 84 L39 65 L73 31 Z" fill="none" {...large} />
		<path d="M43 50 L73 31 L107 65 L77 84 Z" fill="none" {...large} />
		<g
			fill="none"
			stroke={p.outline}
			stroke-width={worldStroke.small}
			stroke-linecap="round"
			opacity="0.55"
		>
			<path d="M54.2 61.2 L84.2 42.2 M65.4 72.4 L95.4 53.4" />
		</g>

		<RoundCluster
			circles={shrub}
			base={p.grassMid}
			shade={p.grassShadow}
			highlight={p.grassLight}
		/>
	</symbol>
{/each}
