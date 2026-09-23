<svelte:options namespace="svg" />

<script lang="ts">
	import Cylinder from './Cylinder.svelte';
	import RoundCluster from './RoundCluster.svelte';
	import {
		outlineSmall as small,
		props,
		tuftPath,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const tankBlue = '#3E8FCB';
	const tankShade = '#2C6FA3';
	const cleanPipe = '#E4EFF4';
	const bins = [
		{ cx: 14, body: '#4E9A4A', shade: '#3A7A38', lid: '#6CB66A' },
		{ cx: 35, body: '#E8B936', shade: '#C99A1E', lid: '#F4D26A' },
		{ cx: 56, body: p.roof, shade: p.roofDark, lid: p.roofLight }
	];
	const holes = [14, 32, 50];
	const shrub: Circle[] = [
		{ x: 13, y: 21, r: 9 },
		{ x: 24, y: 16, r: 11, lit: true },
		{ x: 34, y: 22, r: 8 }
	];
	const sapling: Circle[] = [
		{ x: 16, y: 20, r: 11, lit: true },
		{ x: 24, y: 26, r: 8 }
	];
	const fronds = [
		'M52 30 C60 20 74 20 84 28 C74 26 62 28 52 30 Z',
		'M52 30 C60 28 72 34 78 46 C70 38 62 34 52 30 Z',
		'M52 30 C44 20 32 18 22 24 C32 24 42 26 52 30 Z',
		'M52 30 C44 32 34 38 28 48 C36 40 44 36 52 30 Z',
		'M52 30 C52 20 56 12 64 8 C58 14 54 22 52 30 Z'
	];
	const palmTrunk = 'M34 112 C36 90 40 60 52 32';
</script>

<symbol id={props.ipal.id} viewBox="0 0 {props.ipal.width} {props.ipal.height}">
	<ellipse cx="34" cy="50" rx="28" ry="5" fill="url(#world-shadow)" />
	<Cylinder
		cx={26}
		base={46}
		r={18}
		height={22}
		body={tankBlue}
		shade={tankShade}
		top={p.waterLight}
		small
	/>
	<ellipse cx="26" cy="24" rx="11" ry="4" fill={p.waterDeep} opacity="0.35" />
	<path
		d="M44 38 L56 38 L56 48"
		fill="none"
		stroke={p.outline}
		stroke-width="8"
		stroke-linejoin="round"
	/>
	<path
		d="M44 38 L56 38 L56 48"
		fill="none"
		stroke={cleanPipe}
		stroke-width="4"
		stroke-linejoin="round"
	/>
	<path d="M53 50 Q56 55 59 50 Z" fill={p.waterLight} {...small} />
</symbol>

<symbol id={props.bins.id} viewBox="0 0 {props.bins.width} {props.bins.height}">
	<ellipse cx="38" cy="37" rx="32" ry="4" fill="url(#world-shadow)" />
	{#each bins as bin (bin.cx)}
		<Cylinder
			cx={bin.cx}
			base={34}
			r={9}
			height={20}
			body={bin.body}
			shade={bin.shade}
			top={bin.lid}
			small
		/>
	{/each}
</symbol>

<symbol id={props.biopori.id} viewBox="0 0 {props.biopori.width} {props.biopori.height}">
	{#each holes as x (x)}
		<ellipse cx={x} cy="16" rx="8" ry="4" fill={p.soil} {...small} />
		<ellipse cx={x} cy="16.5" rx="4.5" ry="2" fill={p.outline} />
	{/each}
	<path d={tuftPath(54, 26)} fill={p.grassDark} />
</symbol>

<symbol id={props.eco.id} viewBox="0 0 {props.eco.width} {props.eco.height}">
	<ellipse cx="20" cy="51" rx="12" ry="3" fill="url(#world-shadow)" />
	<rect x="17" y="22" width="5" height="30" rx="1.5" fill={p.wood} {...small} />
	<rect x="4" y="6" width="32" height="20" rx="4" fill={p.plaster} {...small} />
	<path d="M13 21 C12 13 20 9 27 10 C28 17 22 22 13 21 Z" fill={p.grassMid} {...small} />
	<path
		d="M14 20 L24 12"
		fill="none"
		stroke={p.grassShadow}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
</symbol>

<symbol id={props.relocation.id} viewBox="0 0 {props.relocation.width} {props.relocation.height}">
	<ellipse cx="32" cy="40" rx="28" ry="4" fill="url(#world-shadow)" />
	<path d="M10 22 L10 40 M54 22 L54 40" fill="none" {...small} stroke-width="3" />
	<rect x="4" y="10" width="56" height="13" rx="3" fill={p.smokeLight} {...small} />
	<path
		d="M12 11 L20 22 M28 11 L36 22 M44 11 L52 22"
		fill="none"
		stroke={p.roof}
		stroke-width="5"
	/>
	<rect x="4" y="10" width="56" height="13" rx="3" fill="none" {...small} />
</symbol>

<symbol id={props.shrub.id} viewBox="0 0 {props.shrub.width} {props.shrub.height}">
	<ellipse cx="25" cy="30" rx="19" ry="3.5" fill="url(#world-shadow)" />
	<RoundCluster
		circles={shrub}
		base={p.grassMid}
		shade={p.grassShadow}
		highlight={p.grassLight}
		stroke={worldStroke.small}
	/>
</symbol>

<symbol id={props.sapling.id} viewBox="0 0 {props.sapling.width} {props.sapling.height}">
	<ellipse cx="20" cy="54" rx="12" ry="3" fill="url(#world-shadow)" />
	<rect x="16" y="28" width="5" height="26" rx="2" fill={p.wood} {...small} />
	<RoundCluster
		circles={sapling}
		base={p.grassMid}
		shade={p.grassShadow}
		highlight={p.grassLight}
		stroke={worldStroke.small}
	/>
</symbol>

<symbol id={props.palm.id} viewBox="0 0 {props.palm.width} {props.palm.height}">
	<ellipse cx="42" cy="113" rx="24" ry="5" fill="url(#world-shadow)" />
	<path d={palmTrunk} fill="none" stroke={p.outline} stroke-width="11" stroke-linecap="round" />
	<path d={palmTrunk} fill="none" stroke={p.wood} stroke-width="5" stroke-linecap="round" />
	{#each fronds as frond, index (index)}
		<path d={frond} fill={index % 2 === 0 ? p.grassMid : p.grassDark} {...small} />
	{/each}
	<circle cx="49" cy="33" r="3.5" fill={p.woodDark} {...small} />
	<circle cx="55" cy="35" r="3.5" fill={p.woodDark} {...small} />
</symbol>
