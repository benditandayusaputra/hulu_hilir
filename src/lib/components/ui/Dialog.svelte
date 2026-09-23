<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ui } from '$lib/content/ui';
	import Button from './Button.svelte';

	type Side = 'center' | 'bottom' | 'right';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		side?: Side;
		children: Snippet;
		footer?: Snippet | undefined;
	}

	let {
		open = $bindable(),
		title,
		description = '',
		side = 'center',
		children,
		footer
	}: Props = $props();

	let element = $state<HTMLDialogElement | null>(null);
	let heading = $state<HTMLHeadingElement | null>(null);

	const baseId = $props.id();
	const titleId = `${baseId}-title`;
	const descriptionId = `${baseId}-description`;

	const sideClass: Record<Side, string> = {
		center:
			'm-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-[var(--radius-card)]',
		bottom:
			'mx-auto mt-auto mb-0 w-full max-w-[40rem] max-h-[85dvh] rounded-t-[var(--radius-card)]',
		right: 'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(24rem,100vw)] rounded-l-[var(--radius-card)]'
	};

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
	class="overflow-auto border-[1.5px] border-ink/10 bg-surface p-4 text-ink backdrop:bg-black/50 sm:p-6 {sideClass[
		side
	]}"
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
