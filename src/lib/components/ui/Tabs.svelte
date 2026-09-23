<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Tab {
		id: string;
		label: string;
	}

	interface Props {
		tabs: readonly Tab[];
		active: string;
		label: string;
		panel: Snippet<[string]>;
	}

	let { tabs, active = $bindable(), label, panel }: Props = $props();

	const baseId = $props.id();
	let list = $state<HTMLDivElement | null>(null);
	let focused = $state<string | null>(null);

	const focusedId = $derived(focused ?? active);

	function focusIndex(index: number): void {
		const buttons = list?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
		buttons?.[index]?.focus();
	}

	function handleKey(event: KeyboardEvent, index: number): void {
		let next: number | null = null;
		if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
		else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
		else if (event.key === 'Home') next = 0;
		else if (event.key === 'End') next = tabs.length - 1;
		if (next === null) return;
		event.preventDefault();
		focusIndex(next);
	}
</script>

<div
	role="tablist"
	aria-label={label}
	bind:this={list}
	class="flex flex-wrap gap-1 border-b-2 border-paper-edge px-1"
>
	{#each tabs as tab, index (tab.id)}
		<button
			type="button"
			role="tab"
			id="{baseId}-tab-{tab.id}"
			aria-selected={active === tab.id}
			aria-controls="{baseId}-panel-{tab.id}"
			tabindex={focusedId === tab.id ? 0 : -1}
			onclick={() => {
				active = tab.id;
				focused = tab.id;
			}}
			onfocus={() => (focused = tab.id)}
			onkeydown={(event) => handleKey(event, index)}
			class="-mb-[2px] min-h-11 rounded-t-[10px] border-2 px-3 py-2 font-medium {active === tab.id
				? 'border-paper-edge border-b-surface bg-surface text-ink'
				: 'border-transparent bg-surface-2 text-ink-muted hover:text-ink'}"
		>
			{tab.label}
		</button>
	{/each}
</div>
<div
	role="tabpanel"
	id="{baseId}-panel-{active}"
	aria-labelledby="{baseId}-tab-{active}"
	class="pt-4"
>
	{@render panel(active)}
</div>
