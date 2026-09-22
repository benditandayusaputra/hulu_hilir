<script lang="ts">
	import { toaster, type ToastTone } from '$lib/state/toast.svelte';

	const toneClass: Record<ToastTone, string> = {
		info: 'border-primary',
		success: 'border-leaf',
		danger: 'border-danger'
	};
</script>

<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-x-4 top-4 z-40 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
>
	{#each toaster.items as item (item.id)}
		<p
			class="max-w-sm rounded-[var(--radius-card)] border-[1.5px] border-l-4 border-ink/10 bg-surface px-4 py-3 text-sm text-ink shadow-lg {toneClass[
				item.tone
			]}"
		>
			{item.message}
		</p>
	{/each}
</div>
