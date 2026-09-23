<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		side?: 'top' | 'left';
		children: Snippet<[string]>;
	}

	let { text, side = 'top', children }: Props = $props();

	const id = $props.id();
	let visible = $state(false);
	let dismissed = $state(false);

	function show(): void {
		if (!dismissed) visible = true;
	}

	function hide(): void {
		visible = false;
		dismissed = false;
	}

	function handleWindowKey(event: KeyboardEvent): void {
		if (event.key !== 'Escape' || !visible) return;
		visible = false;
		dismissed = true;
	}
</script>

<svelte:window onkeydown={handleWindowKey} />

<span
	role="presentation"
	class="relative inline-flex"
	onpointerenter={show}
	onpointerleave={hide}
	onfocusin={show}
	onfocusout={hide}
>
	{@render children(id)}
	<span
		role="tooltip"
		{id}
		hidden={!visible}
		class="absolute z-30 rounded-[var(--radius-control)] bg-ink px-2 py-1 text-sm whitespace-nowrap text-bg shadow {side ===
		'top'
			? 'bottom-full left-1/2 mb-2 -translate-x-1/2'
			: 'top-1/2 right-full mr-2 -translate-y-1/2'}"
	>
		{text}
	</span>
</span>
