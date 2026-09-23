<svelte:options namespace="svg" />

<script lang="ts">
	import {
		outlineLarge,
		outlineSmall,
		signboard,
		tuftPath,
		worldPalette as p,
		worldStroke
	} from './symbols';

	const face = '#8F5E33';
	const nails: [number, number][] = [
		[16, 26],
		[114, 26],
		[16, 52],
		[114, 52]
	];
</script>

<symbol id={signboard.id} viewBox="0 0 {signboard.width} {signboard.height}">
	<ellipse cx="70" cy="88" rx="52" ry="6" fill="url(#world-shadow)" />
	<rect x="26" y="40" width="9" height="48" rx="2" fill={p.wood} {...outlineLarge} />
	<rect x="96" y="40" width="9" height="48" rx="2" fill={p.woodDark} {...outlineLarge} />
	<rect x="7" y="17" width="116" height="44" rx="7" fill={p.woodDark} {...outlineLarge} />
	<rect x="11" y="20" width="108" height="36" rx="5" fill={face} />
	<path
		d="M16 32 Q60 28 112 33 M18 46 Q64 50 110 45"
		fill="none"
		stroke={p.woodDark}
		stroke-width={worldStroke.small}
		opacity="0.7"
	/>
	<path
		d="M13 22 L117 22"
		fill="none"
		stroke={p.wood}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	{#each nails as [x, y] (`${x}-${y}`)}
		<circle cx={x} cy={y} r="2.5" fill={p.stoneLight} {...outlineSmall} />
	{/each}
	<path d="{tuftPath(22, 90)} {tuftPath(104, 90)}" fill={p.grassDark} />
</symbol>
