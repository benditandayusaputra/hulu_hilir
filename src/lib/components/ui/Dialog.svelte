<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ui } from '$lib/content/ui';
	import Button from './Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(), title, description = '', children, footer }: Props = $props();

	let element = $state<HTMLDialogElement | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);

	const baseId = $props.id();
	const titleId = `${baseId}-title`;
	const descriptionId = `${baseId}-description`;

	$effect(() => {
		const dialog = element;
		if (dialog === null) return;
		if (open && !dialog.open) {
			dialog.showModal();
			heading?.focus();
		}
		if (!open && dialog.open) {
			dialog.close();
		}
	});
</script>

<dialog
	bind:this={element}
	aria-labelledby={titleId}
	aria-describedby={description === '' ? undefined : descriptionId}
	onclose={() => (open = false)}
	class="m-auto w-[min(32rem,calc(100vw-2rem))] rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-surface p-6 text-ink backdrop:bg-black/50"
>
	<div class="flex items-start justify-between gap-4">
		<h2
			id={titleId}
			bind:this={heading}
			tabindex="-1"
			class="text-xl focus-visible:outline-offset-4"
		>
			{title}
		</h2>
		<Button variant="ghost" size="sm" onclick={() => (open = false)}>{ui.close}</Button>
	</div>

	{#if description !== ''}
		<p id={descriptionId} class="mt-2 text-sm text-ink-muted">{description}</p>
	{/if}

	<div class="mt-4">{@render children()}</div>

	{#if footer}
		<div class="mt-6 flex flex-wrap justify-end gap-2">{@render footer()}</div>
	{/if}
</dialog>
