<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import {
		factory,
		outlineLarge as large,
		outlineSmall as small,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const wallTop = 144;
	const roofPeak = 124;
	const depth = { x: 28, y: -17 };
	const teeth = [
		{ from: 24, to: 61 },
		{ from: 61, to: 99 },
		{ from: 99, to: 136 }
	];
	const glassTeeth = teeth.slice(0, -1);
	const mullionSteps = [1 / 3, 2 / 3];

	const smoke: Circle[] = [
		{ x: 55, y: 34, r: 7 },
		{ x: 70, y: 25, r: 10, lit: true },
		{ x: 91, y: 18, r: 12, lit: true },
		{ x: 86, y: 32, r: 8 }
	];

	const windows = [74, 92, 110];
	const shutterLines = [167, 173, 179, 185];

	function slope(from: number, to: number): string {
		return `M${from} ${wallTop} L${to} ${roofPeak} L${to + depth.x} ${roofPeak + depth.y} L${from + depth.x} ${wallTop + depth.y} Z`;
	}

	function glass(at: number): string {
		return `M${at} ${roofPeak} L${at} ${wallTop} L${at + depth.x} ${wallTop + depth.y} L${at + depth.x} ${roofPeak + depth.y} Z`;
	}

	function mullion(at: number, step: number): string {
		const x = at + depth.x * step;
		return `M${x} ${roofPeak + depth.y * step} L${x} ${wallTop + depth.y * step}`;
	}

	const pipe = 'M150 172 L204 172 Q212 172 212 180 L212 197';
</script>

<symbol id={factory.id} viewBox="0 0 {factory.width} {factory.height}">
	<ellipse cx="120" cy="194" rx="104" ry="15" fill="url(#world-shadow)" />

	<path d="M35 42 L35 140 L57 140 L57 42 Z" fill={p.stoneLight} />
	<path d="M50 42 L57 42 L57 140 L50 140 Z" fill={p.stone} />
	<path d="M35 55 L57 55 L57 63 L35 63 Z" fill={p.roof} />
	<path d="M50 55 L57 55 L57 63 L50 63 Z" fill={p.roofDark} />
	<path d="M35 55 L57 55 M35 63 L57 63" fill="none" {...small} />
	<path d="M35 42 L57 42 L57 48 Q46 51 35 48 Z" fill={p.stoneDark} />
	<path d="M35 42 L35 140 M57 42 L57 140" fill="none" {...large} />
	<ellipse cx="46" cy="42" rx="11" ry="4" fill={p.stoneLight} {...large} />
	<ellipse cx="46" cy="42" rx="6.5" ry="2" fill={p.outline} />

	<RoundCluster circles={smoke} base={p.smoke} shade={p.smokeShade} highlight={p.smokeLight} />

	<path d="M136 192 L164 175 L164 107 L136 124 Z" fill={p.stoneDark} {...large} />
	<path d="M150 184 L150 116" fill="none" {...small} opacity="0.45" />
	<path d="M140 138 L147 134 M140 143 L147 139 M140 148 L147 144" fill="none" {...small} />

	{#each teeth as tooth (tooth.from)}
		<path d={slope(tooth.from, tooth.to)} fill={p.stoneLight} {...large} />
	{/each}
	{#each glassTeeth as tooth (tooth.from)}
		<path d={glass(tooth.to)} fill={p.glassShade} {...large} />
		{#each mullionSteps as step (step)}
			<path d={mullion(tooth.to, step)} fill="none" {...small} />
		{/each}
		<path
			d="M{tooth.to + 4} {roofPeak + 6} L{tooth.to + 9} {roofPeak}"
			fill="none"
			stroke={p.glint}
			stroke-width={worldStroke.small}
			stroke-linecap="round"
		/>
	{/each}

	<path
		d="M24 192 L24 {wallTop} L61 {roofPeak} L61 {wallTop} L99 {roofPeak} L99 {wallTop} L136 {roofPeak} L136 192 Z"
		fill={p.stone}
		{...large}
	/>
	<path d="M24 186 L136 186" fill="none" {...small} opacity="0.5" />
	<path d="M70 150 L70 186" fill="none" {...small} opacity="0.35" />

	{#each windows as x (x)}
		<rect {x} y="150" width="12" height="9" rx="1" fill={p.glass} {...small} />
		<path d="M{x} 155 L{x + 12} 155" fill="none" {...small} />
	{/each}

	<rect x="33" y="161" width="30" height="31" fill={p.roof} {...small} />
	<rect x="54" y="161" width="9" height="31" fill={p.roofDark} />
	<g fill="none" stroke={p.outline} stroke-width={worldStroke.small} opacity="0.5">
		{#each shutterLines as y (y)}
			<path d="M33 {y} L63 {y}" />
		{/each}
	</g>
	<rect x="33" y="161" width="30" height="31" fill="none" {...small} />
	<path d="M30 161 L66 161" fill="none" {...large} />

	<path d={pipe} fill="none" stroke={p.outline} stroke-width="13" stroke-linejoin="round" />
	<path d={pipe} fill="none" stroke={p.stone} stroke-width="7" stroke-linejoin="round" />
	<path
		d="M152 170 L204 170 Q210 170 210 178 L210 195"
		fill="none"
		stroke={p.stoneLight}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<ellipse cx="150" cy="172" rx="3" ry="8" fill={p.stoneDark} {...small} />
	<rect x="180" y="164" width="5" height="16" rx="1" fill={p.stoneDark} {...small} />
	<path d="M192 179 L192 190" fill="none" {...large} />
	<path d="M187 191 L197 191" fill="none" {...large} />
	<rect x="204" y="196" width="16" height="5" rx="1" fill={p.stoneDark} {...small} />
	<path d="M208 201 Q212 209 216 201 Z" fill={p.effluent} {...small} />
</symbol>
