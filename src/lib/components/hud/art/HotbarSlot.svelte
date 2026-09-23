<script lang="ts">
	import Lock from '@lucide/svelte/icons/lock';
	import type { Snippet } from 'svelte';
	import Coin from './Coin.svelte';

	interface Props {
		id: string;
		name: string;
		value: string;
		checked: boolean;
		label: string;
		shortLabel?: string;
		cost: string;
		icon: Snippet;
		reason?: string;
		describedBy?: string;
		compact?: boolean;
		onchange: () => void;
	}

	let {
		id,
		name,
		value,
		checked,
		label,
		shortLabel = label,
		cost,
		icon,
		reason = '',
		describedBy,
		compact = false,
		onchange
	}: Props = $props();
</script>

<div class="slot" class:compact>
	<input
		{id}
		type="radio"
		{name}
		{value}
		{checked}
		{onchange}
		aria-describedby={describedBy}
		class="slot-input"
	/>
	<label for={id} class="hotbar-slot" data-unavailable={reason === '' ? undefined : ''}>
		<span class="slot-well">
			{@render icon()}
			{#if reason !== ''}
				<span class="slot-lock"><Lock size={14} aria-hidden="true" /></span>
			{/if}
		</span>
		<span class="slot-label">
			{#if shortLabel === label}
				{label}
			{:else}
				<span aria-hidden="true">{shortLabel}</span><span class="sr-only">{label}</span>
			{/if}
		</span>
		<span class="slot-cost" aria-hidden="true" data-numeric><Coin size={16} />{cost}</span>
		{#if reason !== ''}
			<span class="slot-reason" aria-hidden="true">{reason}</span>
		{/if}
	</label>
</div>

<style>
	.slot {
		position: relative;
		display: flex;
		flex-shrink: 0;
	}

	.slot-input {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		margin: 0;
		appearance: none;
		cursor: pointer;
		border-radius: 12px;
	}

	.hotbar-slot {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		width: 6.25rem;
		min-height: 44px;
		padding: 0.5rem 0.25rem 0.4rem;
		color: var(--color-plank-ink);
		font-size: var(--text-sm);
		font-weight: 700;
		line-height: 1.2;
		text-align: center;
		text-shadow: var(--plank-outline);
		pointer-events: none;
		background: linear-gradient(var(--color-wood-light), var(--color-wood));
		border: 3px solid var(--color-outline);
		border-radius: 12px 10px 13px 11px;
		box-shadow:
			inset 0 2px 0 var(--color-wood-edge),
			0 4px 0 var(--color-wood-dark);
		transition:
			transform var(--dur-fast) var(--ease-out),
			box-shadow var(--dur-fast) var(--ease-out);
	}

	.compact .hotbar-slot {
		padding-top: 0.375rem;
		gap: 0.125rem;
	}

	.slot-input:hover + .hotbar-slot:not([data-unavailable]) {
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

	.compact .slot-well {
		width: 2.25rem;
		height: 2.25rem;
	}

	.slot-label {
		display: grid;
		flex: 1;
		place-items: center;
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

	.slot-reason {
		position: absolute;
		top: -0.625rem;
		left: 50%;
		padding: 0 0.375rem;
		color: var(--color-danger);
		white-space: nowrap;
		text-shadow: none;
		background: var(--color-paper);
		border: 2px solid var(--color-outline);
		border-radius: 6px;
		transform: translateX(-50%) rotate(-3deg);
	}

	.slot-input:checked + .hotbar-slot {
		transform: translateY(-6px);
		box-shadow:
			inset 0 2px 0 var(--color-wood-edge),
			0 4px 0 var(--color-wood-dark),
			0 0 0 3px var(--color-glow),
			0 0 18px 4px color-mix(in oklab, var(--color-glow) 55%, transparent);
		animation: slot-bounce var(--dur-slow) var(--ease-out);
	}

	[data-unavailable] {
		background: var(--color-wood-dark);
	}

	[data-unavailable] .slot-well > :global(svg:first-child) {
		opacity: 0.55;
		filter: grayscale(1);
	}

	:global(:root[data-motion='reduced']) .slot-input:checked + .hotbar-slot {
		transform: none;
		animation: none;
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
