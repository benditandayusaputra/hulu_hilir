<script lang="ts">
	import { toaster, type ToastTone } from '$lib/state/toast.svelte';

	const toneClass: Record<ToastTone, string> = {
		info: 'border-l-primary',
		success: 'border-l-leaf',
		danger: 'border-l-danger'
	};
</script>

<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-x-4 top-4 z-40 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
>
	{#each toaster.items as item (item.id)}
		<p class="paper max-w-sm border-l-[6px] px-4 py-2.5 text-sm {toneClass[item.tone]}">
			{item.message}
		</p>
	{/each}
</div>
