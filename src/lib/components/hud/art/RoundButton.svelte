<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'aria-label'> {
		label: string;
		captioned?: boolean;
		small?: boolean;
		on?: boolean;
		element?: HTMLButtonElement | null;
		children: Snippet;
	}

	let {
		label,
		captioned = false,
		small = false,
		on = false,
		element = $bindable(null),
		children,
		...rest
	}: Props = $props();
</script>

<button
	bind:this={element}
	type="button"
	class="knob-button"
	class:captioned
	aria-label={captioned ? undefined : label}
	{...rest}
>
	<span class="knob" class:knob-sm={small} class:knob-on={on}>{@render children()}</span>
	{#if captioned}
		<span class="knob-caption">{label}</span>
	{/if}
</button>

<style>
	.knob-button {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		border-radius: 9999px;
		cursor: pointer;
	}

	.captioned {
		border-radius: 12px;
	}

	.knob-button:hover .knob {
		transform: translateY(-1px);
	}

	.knob-button:active .knob {
		transform: translateY(3px);
		box-shadow: inset 0 -2px 0 var(--color-knob-edge);
	}

	.knob-caption {
		font-size: var(--text-sm);
		font-weight: 700;
		line-height: 1.2;
		color: var(--color-plank-ink);
		text-shadow: var(--plank-outline);
		white-space: nowrap;
	}
</style>
