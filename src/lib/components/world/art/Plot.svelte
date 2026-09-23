<svelte:options namespace="svg" />

<script lang="ts">
	import { outlineLarge, plot, tuftPath, worldPalette as p } from './symbols';

	const pad =
		'M14 70 C12 36 64 18 122 20 C182 18 230 38 228 70 C230 100 180 114 120 114 C60 116 16 102 14 70 Z';
	const tufts: [number, number][] = [
		[60, 52],
		[168, 44],
		[110, 92],
		[196, 84]
	];
</script>

<symbol id={plot.id} viewBox="0 0 {plot.width} {plot.height}">
	<ellipse cx="128" cy="130" rx="112" ry="14" fill="url(#world-shadow)" />
	<path d={pad} transform="translate(0 14)" fill={p.soilWet} />
	<path d={pad} transform="translate(0 8)" fill={p.soil} />
	<path d={pad} transform="translate(0 14)" fill="none" {...outlineLarge} />
	<path d={pad} fill={p.grassLight} {...outlineLarge} />
	<path d={tufts.map(([x, y]) => tuftPath(x, y)).join(' ')} fill={p.grassDark} />
</symbol>
