<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		text: string;
		children: Snippet<[string]>;
	}

	let { text, children }: Props = $props();

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
		class="absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 rounded-[var(--radius-control)] bg-ink px-2 py-1 text-sm whitespace-nowrap text-bg shadow"
	>
		{text}
	</span>
</span>
