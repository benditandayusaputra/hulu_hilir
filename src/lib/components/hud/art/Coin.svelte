<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 20 }: Props = $props();
</script>

<svg
	aria-hidden="true"
	focusable="false"
	viewBox="0 0 24 24"
	width={size}
	height={size}
	class="inline-block shrink-0"
>
	<circle cx="12" cy="13" r="9.5" fill="#C98A12" stroke="#3B2A22" stroke-width="1.75" />
	<circle cx="12" cy="11.5" r="9.5" fill="#F2B632" stroke="#3B2A22" stroke-width="1.75" />
	<circle cx="12" cy="11.5" r="6" fill="none" stroke="#C98A12" stroke-width="1.5" />
	<path
		d="M12 8 L13.2 10.6 L16 11 L13.9 12.8 L14.5 15.5 L12 14.1 L9.5 15.5 L10.1 12.8 L8 11 L10.8 10.6 Z"
		fill="#C98A12"
	/>
	<path
		d="M6.5 8.5 A6.5 6.5 0 0 1 10 5.4"
		fill="none"
		stroke="#FFE08A"
		stroke-width="1.75"
		stroke-linecap="round"
	/>
</svg>
