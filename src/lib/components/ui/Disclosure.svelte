<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';

	interface Props {
		summary: string;
		open?: boolean;
		children: Snippet;
	}

	let { summary, open = $bindable(false), children }: Props = $props();
</script>

<details bind:open class="group rounded-[var(--radius-control)] border-[1.5px] border-ink/10">
	<summary
		class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-medium [&::-webkit-details-marker]:hidden"
	>
		{summary}
		<ChevronDown
			size={20}
			aria-hidden="true"
			class="shrink-0 transition-transform duration-[var(--dur-fast)] group-open:rotate-180"
		/>
	</summary>
	<div class="px-3 pb-3">{@render children()}</div>
</details>
