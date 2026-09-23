<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		nails?: boolean;
		class?: string;
	}

	let { children, nails = true, class: className = '' }: Props = $props();
</script>

<div class="wood px-7 py-3.5 {className}" class:wood-nails={nails}>
	{@render children()}
</div>
