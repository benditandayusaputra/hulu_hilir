<script lang="ts">
	import type { Indicators } from '$lib/sim';

	interface Props {
		kind: keyof Indicators;
		size?: number;
	}

	let { kind, size = 28 }: Props = $props();

	const outline = {
		stroke: '#3B2A22',
		'stroke-width': 1.75,
		'stroke-linejoin': 'round',
		'stroke-linecap': 'round'
	} as const;
</script>

<svg
	aria-hidden="true"
	focusable="false"
	viewBox="0 0 24 24"
	width={size}
	height={size}
	class="inline-block shrink-0"
>
	{#if kind === 'waterQuality'}
		<path
			d="M12 2.5 C12 2.5 5 10 5 14.5 A7 7 0 0 0 19 14.5 C19 10 12 2.5 12 2.5 Z"
			fill="#5CC4E6"
		/>
		<path d="M14 5 C16 8 19 11.5 19 14.5 A7 7 0 0 1 12 21.5 C16 19 16.5 12 14 5 Z" fill="#2E8BC0" />
		<ellipse cx="9.2" cy="13.5" rx="1.4" ry="2.6" fill="#FFFFFF" transform="rotate(20 9.2 13.5)" />
		<path
			d="M12 2.5 C12 2.5 5 10 5 14.5 A7 7 0 0 0 19 14.5 C19 10 12 2.5 12 2.5 Z"
			fill="none"
			{...outline}
		/>
	{:else if kind === 'fish'}
		<path
			d="M3 12 C6 6 14 5 18 10 L22 6 L21.5 12 L22 18 L18 14 C14 19 6 18 3 12 Z"
			fill="#F2A65A"
		/>
		<path d="M4.5 13 C8 17 14 17 18 14 C13 15 8 15 4.5 13 Z" fill="#FBD9A8" />
		<path
			d="M3 12 C6 6 14 5 18 10 L22 6 L21.5 12 L22 18 L18 14 C14 19 6 18 3 12 Z"
			fill="none"
			{...outline}
		/>
		<circle cx="7.5" cy="10.5" r="1.3" fill="#3B2A22" />
	{:else if kind === 'floodRisk'}
		<path d="M5 12 L12 5.5 L19 12 L19 19 L5 19 Z" fill="#F6EBD2" {...outline} />
		<path
			d="M3.5 12.5 L12 4.5 L20.5 12.5"
			fill="none"
			stroke="#C8553D"
			stroke-width="3"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path d="M3.5 12.5 L12 4.5 L20.5 12.5" fill="none" {...outline} />
		<path
			d="M2 17 Q5 14.5 8 17 T14 17 T20 17 T23 16.5 L23 22 L2 22 Z"
			fill="#5CC4E6"
			{...outline}
		/>
	{:else}
		<ellipse cx="12" cy="17" rx="8" ry="3.5" fill="#C98A12" {...outline} />
		<path d="M4 13 L4 17 A8 3.5 0 0 0 20 17 L20 13" fill="#E3A21E" {...outline} />
		<ellipse cx="12" cy="13" rx="8" ry="3.5" fill="#F2B632" {...outline} />
		<path d="M4 8 L4 11 A8 3.5 0 0 0 20 11 L20 8" fill="#E3A21E" {...outline} />
		<ellipse cx="12" cy="8" rx="8" ry="3.5" fill="#F2B632" {...outline} />
		<path
			d="M8 7 A5 2 0 0 1 12 5.6"
			fill="none"
			stroke="#FFE08A"
			stroke-width="1.5"
			stroke-linecap="round"
		/>
	{/if}
</svg>
