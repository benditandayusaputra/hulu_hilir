<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();
</script>

<kbd
	class="inline-block min-w-6 rounded-[6px] border-[1.5px] border-ink/15 bg-surface-2 px-1.5 py-0.5 text-center font-sans text-sm font-medium"
>
	{@render children()}
</kbd>
