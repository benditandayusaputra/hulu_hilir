<script lang="ts">
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import type { Snippet } from 'svelte';
	import { formatScore } from '$lib/format/number';

	type Trend = 'up' | 'down' | 'flat';

	interface Props {
		label: string;
		value: number;
		max?: number;
		valueText: string;
		trend?: Trend | null;
		icon?: Snippet;
		tone?: string;
		compact?: boolean;
	}

	let {
		label,
		value,
		max = 100,
		valueText,
		trend = null,
		icon,
		tone = 'var(--color-primary)',
		compact = false
	}: Props = $props();

	const id = $props.id();
	const ratio = $derived(Math.max(0, Math.min(1, value / max)));
</script>

<div class="flex min-w-0 items-center gap-1 md:gap-1.5">
	{#if icon}
		<span class="shrink-0 max-md:[&_svg]:size-5" aria-hidden="true">{@render icon()}</span>
	{/if}
	<div class="flex min-w-0 flex-1 flex-col">
		<span
			id="{id}-label"
			class="truncate text-sm leading-tight font-semibold {compact ? 'max-md:sr-only' : ''}"
		>
			{label}
		</span>
		<div class="flex items-center gap-1 md:gap-1.5">
			<div
				role="meter"
				aria-labelledby="{id}-label"
				aria-valuemin="0"
				aria-valuemax={max}
				aria-valuenow={Math.round(value)}
				aria-valuetext={valueText}
				class="h-3 min-w-3 flex-1 overflow-hidden rounded-[var(--radius-chip)] border-2 border-outline bg-wood-dark"
			>
				<div
					class="h-full origin-left transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]"
					style:background-color={tone}
					style:transform="scaleX({ratio})"
				></div>
			</div>
			<span data-numeric class="text-right leading-tight font-bold max-md:text-sm md:min-w-8"
				>{formatScore(value)}</span
			>
			{#if trend === 'up'}
				<TrendingUp size={16} aria-hidden="true" class="shrink-0 max-md:hidden" />
			{:else if trend === 'down'}
				<TrendingDown size={16} aria-hidden="true" class="shrink-0 max-md:hidden" />
			{/if}
		</div>
	</div>
</div>
