<svelte:options namespace="svg" />

<script lang="ts">
	import Cylinder from './Cylinder.svelte';
	import {
		ellipseRatio,
		ipal,
		outlineLarge,
		outlineSmall,
		worldPalette as p,
		worldStroke
	} from './symbols';

	const tankBlue = '#3E8FCB';
	const tankShade = '#2C6FA3';
	const tankLid = '#8FC7EA';
	const cleanPipe = '#E4EFF4';
	const big = { cx: 86, base: 150, r: 52, height: 46 };
	const small = { cx: 184, base: 116, r: 28, height: 38 };
	const bigTop = big.base - big.height;
	const inner = { rx: big.r - 7, ry: (big.r - 7) * ellipseRatio };
	const pipe = 'M138 148 L188 148 Q198 148 198 158 L198 176';
</script>

<symbol id={ipal.id} viewBox="0 0 {ipal.width} {ipal.height}">
	<ellipse cx="118" cy="164" rx="104" ry="16" fill="url(#world-shadow)" />

	<Cylinder {...small} body={tankBlue} shade={tankShade} top={tankLid} />
	<path
		d="M{small.cx - 10} {small.base - small.height - 2} L{small.cx + 10} {small.base -
			small.height +
			2}"
		fill="none"
		{...outlineSmall}
	/>
	<path d="M150 106 L160 106" fill="none" stroke={p.outline} stroke-width="11" />
	<path d="M150 106 L160 106" fill="none" stroke={cleanPipe} stroke-width="5" />

	<Cylinder {...big} body={tankBlue} shade={tankShade} top={p.stoneLight} />
	<path
		d="M{big.cx - big.r} {bigTop + 18} A{big.r} {big.r * ellipseRatio} 0 0 0 {big.cx +
			big.r} {bigTop + 18}"
		fill="none"
		stroke={tankShade}
		stroke-width={worldStroke.small}
	/>
	<ellipse
		cx={big.cx}
		cy={bigTop}
		rx={inner.rx}
		ry={inner.ry}
		fill={p.waterLight}
		{...outlineSmall}
	/>
	<path
		d="M{big.cx - inner.rx} {bigTop} A{inner.rx} {inner.ry} 0 0 1 {big.cx +
			inner.rx} {bigTop} A{inner.rx} {inner.ry - 5} 0 0 0 {big.cx - inner.rx} {bigTop} Z"
		fill={p.waterDeep}
		opacity="0.5"
	/>
	<path
		d="M{big.cx} {bigTop} L{big.cx + inner.rx - 2} {bigTop + 5}"
		fill="none"
		stroke={p.stoneDark}
		stroke-width="4"
		stroke-linecap="round"
	/>
	<ellipse cx={big.cx} cy={bigTop} rx="6" ry="2.4" fill={p.stoneLight} {...outlineSmall} />
	<path
		d="M{big.cx - 26} {bigTop + 4} q4 -3 8 0 t8 0"
		fill="none"
		stroke={p.glint}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path
		d="M{big.cx - 40} {bigTop + 6} L{big.cx - 40} {big.base + 8} M{big.cx - 32} {bigTop +
			8} L{big.cx - 32} {big.base + 10} M{big.cx - 40} {bigTop + 18} L{big.cx - 32} {bigTop +
			19} M{big.cx - 40} {bigTop + 28} L{big.cx - 32} {bigTop + 29} M{big.cx - 40} {bigTop +
			38} L{big.cx - 32} {bigTop + 39}"
		fill="none"
		{...outlineSmall}
	/>

	<path d={pipe} fill="none" stroke={p.outline} stroke-width="13" stroke-linejoin="round" />
	<path d={pipe} fill="none" stroke={cleanPipe} stroke-width="7" stroke-linejoin="round" />
	<path
		d="M140 146 L188 146 Q196 146 196 156 L196 174"
		fill="none"
		stroke={p.smokeLight}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<rect x="164" y="140" width="5" height="16" rx="1" fill={p.waterDeep} {...outlineSmall} />
	<rect x="190" y="175" width="16" height="5" rx="1" fill={p.waterDeep} {...outlineSmall} />
	<path d="M193 180 Q198 190 203 180 Z" fill={p.waterLight} {...outlineSmall} />
	<path
		d="M190 188 q4 -2 8 0 t8 0"
		fill="none"
		stroke={p.glint}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path d="M174 157 L174 170 M168 171 L180 171" fill="none" {...outlineLarge} />
</symbol>
