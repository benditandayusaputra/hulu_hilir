<script lang="ts">
	import type { Snippet } from 'svelte';
	import Dialog from './Dialog.svelte';

	interface Props {
		open: boolean;
		title: string;
		description?: string;
		side?: 'bottom' | 'right';
		children: Snippet;
		footer?: Snippet | undefined;
	}

	let {
		open = $bindable(),
		title,
		description = '',
		side = 'bottom',
		children,
		footer
	}: Props = $props();
</script>

<Dialog bind:open {title} {description} {side} {footer}>
	{@render children()}
</Dialog>
