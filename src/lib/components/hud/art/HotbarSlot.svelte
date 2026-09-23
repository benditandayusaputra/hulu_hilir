<script lang="ts">
	import Lock from '@lucide/svelte/icons/lock';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Coin from './Coin.svelte';

	interface Props extends Omit<HTMLButtonAttributes, 'children'> {
		label: string;
		cost: string;
		icon: Snippet;
		selected?: boolean;
		available?: boolean;
	}

	let { label, cost, icon, selected = false, available = true, ...rest }: Props = $props();
</script>

<button
	type="button"
	class="hotbar-slot"
	aria-pressed={selected}
	aria-disabled={!available}
	data-selected={selected || undefined}
	data-unavailable={!available || undefined}
	{...rest}
>
	<span class="slot-well">
		{@render icon()}
		{#if !available}
			<span class="slot-lock"><Lock size={14} aria-hidden="true" /></span>
		{/if}
	</span>
	<span class="slot-label">{label}</span>
	<span class="slot-cost" data-numeric><Coin size={16} />{cost}</span>
</button>

<style>
	.hotbar-slot {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		min-width: 5.75rem;
		min-height: 44px;
		padding: 0.5rem 0.5rem 0.4rem;
		color: var(--color-plank-ink);
		font-size: 0.875rem;
		font-weight: 700;
		line-height: 1.2;
		text-shadow:
			0 1px 0 var(--color-outline),
			0 -1px 0 var(--color-outline),
			1px 0 0 var(--color-outline),
			-1px 0 0 var(--color-outline);
		background: linear-gradient(var(--color-wood-light), var(--color-wood));
		border: 3px solid var(--color-outline);
		border-radius: 12px 10px 13px 11px;
		box-shadow:
			inset 0 2px 0 var(--color-wood-edge),
			0 4px 0 var(--color-wood-dark);
		cursor: pointer;
		transition:
			transform var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	.hotbar-slot:hover:not([data-unavailable]) {
		transform: translateY(-2px);
	}

	.slot-well {
		position: relative;
		display: grid;
		place-items: center;
		width: 2.75rem;
		height: 2.75rem;
		background: var(--color-wood-dark);
		border: 2px solid var(--color-outline);
		border-radius: 10px;
		box-shadow: inset 0 3px 0 rgb(0 0 0 / 0.2);
	}

	.slot-cost {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.slot-lock {
		position: absolute;
		right: -6px;
		bottom: -6px;
		display: grid;
		place-items: center;
		width: 1.25rem;
		height: 1.25rem;
		color: var(--color-plank-ink);
		background: var(--color-outline);
		border-radius: 9999px;
	}

	[data-selected] {
		transform: translateY(-6px);
		box-shadow:
			inset 0 2px 0 var(--color-wood-edge),
			0 4px 0 var(--color-wood-dark),
			0 0 0 3px var(--color-glow),
			0 0 18px 4px color-mix(in oklab, var(--color-glow) 55%, transparent);
		animation: slot-bounce var(--dur-slow) var(--ease-out);
	}

	[data-selected]:hover {
		transform: translateY(-6px);
	}

	[data-unavailable] {
		background: var(--color-wood-dark);
		box-shadow: 0 4px 0 var(--color-wood-dark);
		cursor: not-allowed;
	}

	[data-unavailable] .slot-well > :global(svg:first-child) {
		opacity: 0.55;
		filter: grayscale(1);
	}

	@keyframes slot-bounce {
		30% {
			transform: translateY(-12px);
		}
		60% {
			transform: translateY(-4px);
		}
	}
</style>
