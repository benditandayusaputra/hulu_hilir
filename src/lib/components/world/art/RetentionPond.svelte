<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import {
		outlineLarge,
		outlineSmall,
		retentionPond,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const center = { x: 115, y: 76 };
	const outer = { rx: 104, ry: 52 };
	const inner = { rx: 88, ry: 40 };
	const rimDepth = 9;
	const blockAngles = [15, 40, 65, 90, 115, 140, 165, 195, 225, 255, 285, 315, 345];
	const boulders: Circle[] = [
		{ x: 30, y: 58, r: 8, lit: true },
		{ x: 40, y: 54, r: 6 }
	];
	const lilyPads = [
		{ x: 72, y: 88, r: 9 },
		{ x: 90, y: 96, r: 6 }
	];
	const reedHeads: [number, number][] = [
		[190, 60],
		[196, 56],
		[202, 62]
	];

	const bandLines = [-86, -50, -12, 26, 66]
		.map((dx) => {
			const top = center.y + outer.ry * Math.sqrt(1 - (dx / outer.rx) ** 2);
			return `M${center.x + dx} ${top + 1.5} L${center.x + dx} ${top + rimDepth - 1.5}`;
		})
		.join(' ');

	function lilyPad(x: number, y: number, r: number): string {
		const ry = r * 0.55;
		const notch = 0.35;
		const ax = x + r * Math.cos(-notch);
		const ay = y + ry * Math.sin(-notch);
		const by = y + ry * Math.sin(notch);
		return `M${x} ${y} L${ax} ${ay} A${r} ${ry} 0 1 0 ${ax} ${by} Z`;
	}

	function blockLine(angle: number): string {
		const radians = (angle * Math.PI) / 180;
		const cos = Math.cos(radians);
		const sin = Math.sin(radians);
		return `M${center.x + inner.rx * cos} ${center.y + inner.ry * sin} L${center.x + outer.rx * cos} ${center.y + outer.ry * sin}`;
	}
</script>

<symbol id={retentionPond.id} viewBox="0 0 {retentionPond.width} {retentionPond.height}">
	<ellipse cx="124" cy="138" rx="104" ry="16" fill="url(#world-shadow)" />
	<ellipse
		cx={center.x}
		cy={center.y + rimDepth}
		rx={outer.rx}
		ry={outer.ry}
		fill={p.stoneDark}
		{...outlineLarge}
	/>
	<ellipse
		cx={center.x}
		cy={center.y}
		rx={outer.rx}
		ry={outer.ry}
		fill={p.stone}
		{...outlineLarge}
	/>
	<g fill="none" stroke={p.stoneDark} stroke-width={worldStroke.small}>
		{#each blockAngles as angle (angle)}
			<path d={blockLine(angle)} />
		{/each}
		<path d={bandLines} />
	</g>
	<ellipse
		cx={center.x}
		cy={center.y}
		rx={inner.rx}
		ry={inner.ry}
		fill="url(#world-water-good)"
		{...outlineLarge}
	/>
	<path
		d="M{center.x - inner.rx} {center.y} A{inner.rx} {inner.ry} 0 0 1 {center.x +
			inner.rx} {center.y} A{inner.rx} {inner.ry - 9} 0 0 0 {center.x - inner.rx} {center.y} Z"
		fill={p.stoneDark}
	/>
	<path
		d="M{center.x - inner.rx} {center.y} A{inner.rx} {inner.ry} 0 0 1 {center.x +
			inner.rx} {center.y}"
		fill="none"
		{...outlineLarge}
	/>
	<g fill="none" stroke={p.glint} stroke-width={worldStroke.large} stroke-linecap="round">
		<path d="M120 88 q4 -3 8 0 t8 0" />
		<path d="M150 100 q4 -3 8 0 t8 0" />
		<path d="M100 70 q4 -3 8 0 t8 0" />
	</g>
	{#each lilyPads as pad (pad.x)}
		<path d={lilyPad(pad.x, pad.y, pad.r)} fill={p.grassMid} {...outlineSmall} />
	{/each}
	<circle cx="76" cy="85" r="3" fill="#F4A9C0" {...outlineSmall} />
	<g fill="none" stroke={p.grassShadow} stroke-width={worldStroke.small} stroke-linecap="round">
		<path
			d="M188 84 Q188 70 190 58 M194 84 Q195 70 196 54 M200 84 Q201 72 202 60 M206 84 Q208 76 212 68"
		/>
	</g>
	{#each reedHeads as [x, y] (x)}
		<rect x={x - 2} {y} width="4" height="10" rx="2" fill={p.woodDark} {...outlineSmall} />
	{/each}
	<RoundCluster circles={boulders} base={p.stone} shade={p.stoneDark} highlight={p.stoneLight} />
</symbol>
