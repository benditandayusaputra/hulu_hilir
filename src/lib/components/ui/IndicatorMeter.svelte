<script lang="ts">
	import Minus from '@lucide/svelte/icons/minus';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import { formatScore } from '$lib/format/number';

	type Trend = 'up' | 'down' | 'flat';

	interface Props {
		label: string;
		value: number;
		max?: number;
		valueText: string;
		trend?: Trend | null;
		deltaText?: string;
		compact?: boolean;
	}

	let {
		label,
		value,
		max = 100,
		valueText,
		trend = null,
		deltaText = '',
		compact = false
	}: Props = $props();

	const id = $props.id();
	const ratio = $derived(Math.max(0, Math.min(1, value / max)));
</script>

<div class="flex flex-col gap-1">
	<div class="flex items-baseline justify-between gap-2">
		<span id="{id}-label" class="{compact ? 'text-sm' : ''} font-medium">{label}</span>
		<span data-numeric class="{compact ? 'text-base' : 'text-lg'} font-semibold">
			{formatScore(value)}<span class="text-sm font-normal text-ink-muted">
				/ {formatScore(max)}</span
			>
		</span>
	</div>
	<div
		role="meter"
		aria-labelledby="{id}-label"
		aria-valuemin="0"
		aria-valuemax={max}
		aria-valuenow={Math.round(value)}
		aria-valuetext={valueText}
		class="h-2 overflow-hidden rounded-[var(--radius-chip)] bg-ink/10"
	>
		<div
			class="h-full origin-left rounded-[var(--radius-chip)] bg-primary transition-transform duration-[var(--dur-slow)] ease-[var(--ease-out)]"
			style="transform: scaleX({ratio})"
		></div>
	</div>
	{#if trend !== null && !compact}
		<p class="flex items-center gap-1 text-sm text-ink-muted">
			{#if trend === 'up'}
				<TrendingUp size={16} aria-hidden="true" />
			{:else if trend === 'down'}
				<TrendingDown size={16} aria-hidden="true" />
			{:else}
				<Minus size={16} aria-hidden="true" />
			{/if}
			{deltaText}
		</p>
	{/if}
</div>
