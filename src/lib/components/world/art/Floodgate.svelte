<svelte:options namespace="svg" />

<script lang="ts">
	import Prism from './Prism.svelte';
	import { floodgate, outlineLarge, outlineSmall, worldPalette as p, worldStroke } from './symbols';

	const steel = '#5F7F8C';
	const steelDark = '#3E5864';
	const channel = 'M84 20 L150 20 L178 200 L56 200 Z';
	const ribs = [96, 106, 116, 126];
	const posts = [52, 76, 100, 124, 148, 172];
	const pipe = 'M198 102 L198 146 Q198 156 188 156 L172 156';
	const spokes = 'M116 43 L116 61 M107 52 L125 52 M110 46 L122 58 M122 46 L110 58';
</script>

<symbol id={floodgate.id} viewBox="0 0 {floodgate.width} {floodgate.height}">
	<path d={channel} fill="url(#world-water-good)" />
	<path d="M70 20 L84 20 L56 200 L38 200 Z" fill={p.stone} {...outlineLarge} />
	<path d="M150 20 L164 20 L196 200 L178 200 Z" fill={p.stoneDark} {...outlineLarge} />
	<g fill="none" stroke={p.glint} stroke-width={worldStroke.large} stroke-linecap="round">
		<path d="M100 40 q4 -3 8 0 t8 0" />
		<path d="M96 170 q4 -3 8 0 t8 0" />
		<path d="M130 184 q4 -3 8 0 t8 0" />
	</g>

	<Prism
		x={190}
		base={112}
		width={44}
		height={36}
		deep={24}
		front={p.plaster}
		side={p.plasterShade}
		top={p.stoneLight}
	/>
	<rect x="198" y="92" width="11" height="20" fill={steelDark} {...outlineSmall} />
	<rect x="215" y="86" width="12" height="9" fill={p.glassShade} {...outlineSmall} />
	<path d="M221 86 L221 95" fill="none" {...outlineSmall} />

	<Prism
		x={52}
		base={140}
		width={22}
		height={76}
		deep={16}
		front={p.stone}
		side={p.stoneDark}
		top={p.stoneLight}
	/>
	<Prism
		x={156}
		base={140}
		width={22}
		height={76}
		deep={16}
		front={p.stone}
		side={p.stoneDark}
		top={p.stoneLight}
	/>
	<rect x="74" y="86" width="82" height="48" fill={steel} {...outlineLarge} />
	<g fill="none" stroke={steelDark} stroke-width={worldStroke.small}>
		{#each ribs as y (y)}
			<path d="M76 {y} L154 {y}" />
		{/each}
	</g>
	<path
		d="M76 134 q10 -4 20 0 t20 0 t20 0 t18 0"
		fill="none"
		stroke={p.foam}
		stroke-width={worldStroke.large}
		stroke-linecap="round"
	/>

	<Prism
		x={44}
		base={74}
		width={142}
		height={10}
		deep={18}
		front={p.stoneLight}
		side={p.stone}
		top={p.stoneLight}
	/>
	<g fill="none" {...outlineSmall}>
		{#each posts as x (x)}
			<path d="M{x} 64 L{x} 52" />
		{/each}
		<path d="M50 53 L176 53" />
	</g>
	<path d="M116 64 L116 52" fill="none" {...outlineLarge} />
	<circle cx="116" cy="52" r="9" fill="none" stroke={p.outline} stroke-width="8" />
	<circle cx="116" cy="52" r="9" fill="none" stroke={p.roof} stroke-width="4" />
	<path d={spokes} fill="none" {...outlineSmall} />

	<path d={pipe} fill="none" stroke={p.outline} stroke-width="13" stroke-linejoin="round" />
	<path d={pipe} fill="none" stroke={p.stone} stroke-width="7" stroke-linejoin="round" />
	<path
		d="M196 104 L196 146 Q196 154 188 154 L174 154"
		fill="none"
		stroke={p.stoneLight}
		stroke-width={worldStroke.small}
	/>
	<path d="M170 150 Q160 156 166 164 Q172 158 170 150 Z" fill={p.waterLight} {...outlineSmall} />
</symbol>
