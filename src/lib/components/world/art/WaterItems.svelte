<svelte:options namespace="svg" />

<script lang="ts">
	import RoundCluster from './RoundCluster.svelte';
	import {
		outlineSmall as small,
		waterItems,
		worldPalette as p,
		worldStroke,
		type Circle
	} from './symbols';

	const bubbles: Circle[] = [
		{ x: -6, y: 0.5, r: 3 },
		{ x: 0, y: -1.5, r: 4, lit: true },
		{ x: 6, y: 0.5, r: 3 },
		{ x: 1, y: 2.5, r: 2.5 }
	];

	const plastic = '#D6EEF3';
	const bag = '#F1EEE4';
	const bagShade = '#D5CFBF';
	const deadScale = '#C4C8BA';
	const deadBelly = '#E6E7DC';
	const sludge = '#1A1410';
	const sheenViolet = '#8B7DB5';
	const sheenTeal = '#5FA394';
	const fishShadow = '#1B5E85';
	const foamShade = '#D5DAD0';
	const scum = '#B3A987';
	const scumShade = '#8C825E';
</script>

<symbol id={waterItems.fishShadow} overflow="visible">
	<path
		d="M-12 0 C-8 -6 4 -6 8 -1 L14 -6 L13 0 L14 6 L8 1 C4 6 -8 6 -12 0 Z"
		fill={fishShadow}
		opacity="0.45"
	/>
</symbol>

<symbol id={waterItems.foam} overflow="visible">
	<RoundCluster
		circles={bubbles}
		base={p.foam}
		shade={foamShade}
		highlight={p.smokeLight}
		stroke={worldStroke.small}
	/>
</symbol>

<symbol id={waterItems.scum} overflow="visible">
	<RoundCluster circles={bubbles} base={scum} shade={scumShade} stroke={worldStroke.small} />
</symbol>

<symbol id={waterItems.bottle} overflow="visible">
	<path d="M7 -2.5 L10 -2.5 L10 2.5 L7 2.5 Z" fill={plastic} {...small} />
	<rect x="-11" y="-4.5" width="19" height="9" rx="4.5" fill={plastic} />
	<rect x="-4" y="-4.5" width="6" height="9" fill={p.roof} />
	<rect x="-11" y="-4.5" width="19" height="9" rx="4.5" fill="none" {...small} />
	<rect x="10" y="-3" width="4" height="6" rx="1" fill={p.waterDeep} {...small} />
	<path
		d="M-8 -2 L-5 -2"
		fill="none"
		stroke={p.smokeLight}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
</symbol>

<symbol id={waterItems.bag} overflow="visible">
	<path d="M-2 -6 L-1 -11 L3 -10 L2 -6 Z" fill={bag} {...small} />
	<path d="M-9 3 C-11 -3 -6 -7 -1 -6 C4 -8 10 -4 9 2 C8 7 -6 8 -9 3 Z" fill={bag} />
	<path d="M9 2 C8 7 -6 8 -9 3 C-3 5 4 4 9 2 Z" fill={bagShade} />
	<path
		d="M-3 -1 Q0 1 4 -1"
		fill="none"
		stroke={bagShade}
		stroke-width={worldStroke.small}
		stroke-linecap="round"
	/>
	<path d="M-9 3 C-11 -3 -6 -7 -1 -6 C4 -8 10 -4 9 2 C8 7 -6 8 -9 3 Z" fill="none" {...small} />
</symbol>

<symbol id={waterItems.can} overflow="visible">
	<rect x="-7" y="-4" width="14" height="8" rx="1.5" fill={p.roof} />
	<rect x="-7" y="1" width="14" height="3" fill={p.roofDark} />
	<rect x="-7" y="-4" width="14" height="8" rx="1.5" fill="none" {...small} />
	<ellipse cx="-7" cy="0" rx="2.2" ry="4" fill={p.stoneLight} {...small} />
</symbol>

<symbol id={waterItems.deadFish} overflow="visible">
	<path d="M-2 -5 L0 -10 L3 -5 Z" fill={deadScale} {...small} />
	<path
		d="M-15 0 C-10 -8 6 -8 10 -2 L17 -8 L16 0 L17 8 L10 2 C6 8 -10 8 -15 0 Z"
		fill={deadScale}
	/>
	<path d="M-13 -1 C-8 -6 5 -6 9 -2 C4 -1 -6 -1 -13 -1 Z" fill={deadBelly} />
	<path
		d="M-15 0 C-10 -8 6 -8 10 -2 L17 -8 L16 0 L17 8 L10 2 C6 8 -10 8 -15 0 Z"
		fill="none"
		{...small}
	/>
	<path d="M-11.5 -3.5 L-8 0 M-8 -3.5 L-11.5 0" fill="none" {...small} />
</symbol>

<symbol id={waterItems.sludge} overflow="visible">
	<path
		d="M-18 -2 C-16 -9 -4 -10 2 -7 C10 -11 20 -6 18 1 C17 8 4 9 -2 7 C-10 10 -20 6 -18 -2 Z"
		fill={sludge}
		opacity="0.85"
	/>
	<g fill="none" stroke-width={worldStroke.small} stroke-linecap="round">
		<path d="M-10 -2 Q-2 -7 8 -3" stroke={sheenViolet} opacity="0.75" />
		<path d="M-6 3 Q3 -1 12 2" stroke={sheenTeal} opacity="0.65" />
	</g>
</symbol>
