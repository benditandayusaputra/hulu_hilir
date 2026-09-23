<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ui } from '$lib/content/ui';
	import Button from './Button.svelte';

	type Side = 'center' | 'bottom' | 'right';
	type Skin = 'paper' | 'table';

	interface Parts {
		titleId: string;
		descriptionId: string;
		close: () => void;
	}

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		side?: Side;
		skin?: Skin;
		children?: Snippet;
		footer?: Snippet | undefined;
		content?: Snippet<[Parts]>;
	}

	let {
		open = $bindable(),
		title,
		description = '',
		side = 'center',
		skin = 'paper',
		children,
		footer,
		content
	}: Props = $props();

	let element = $state<HTMLDialogElement | null>(null);

	const baseId = $props.id();
	const titleId = `${baseId}-title`;
	const descriptionId = `${baseId}-description`;

	const sideClass: Record<Side, string> = {
		center:
			'm-auto w-[min(32rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] rounded-[var(--radius-card)]',
		bottom:
			'mx-auto mt-auto mb-0 w-full max-w-[40rem] max-h-[85dvh] rounded-t-[var(--radius-card)] rounded-b-none border-b-0',
		right:
			'my-0 mr-0 ml-auto h-dvh max-h-dvh w-[min(24rem,100vw)] rounded-l-[var(--radius-card)] rounded-r-none border-r-0'
	};

	const skinClass: Record<Skin, string> = {
		paper: 'paper p-4 sm:p-6',
		table: 'wood p-3 sm:p-5 sm:w-[min(40rem,calc(100vw-2rem))]'
	};

	function close(): void {
		open = false;
	}

	$effect(() => {
		const dialog = element;
		if (dialog === null) return;
		if (open && !dialog.open) {
			dialog.showModal();
			document.getElementById(titleId)?.focus();
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
	onclose={close}
	class="overflow-auto backdrop:bg-black/50 {skinClass[skin]} {sideClass[side]}"
>
	{#if content}
		{@render content({ titleId, descriptionId, close })}
	{:else}
		<div class="flex items-start justify-between gap-4">
			<h2 id={titleId} tabindex="-1" class="text-xl focus-visible:outline-offset-4">
				{title}
			</h2>
			<Button variant="ghost" size="sm" onclick={close}>{ui.close}</Button>
		</div>

		{#if description !== ''}
			<p id={descriptionId} class="mt-2 text-sm text-ink-muted">{description}</p>
		{/if}

		<div class="mt-4">{@render children?.()}</div>

		{#if footer}
			<div class="mt-6 flex flex-wrap justify-end gap-2">{@render footer()}</div>
		{/if}
	{/if}
</dialog>
