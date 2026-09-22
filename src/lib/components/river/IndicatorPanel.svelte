<script lang="ts">
	import IndicatorMeter from '$lib/components/ui/IndicatorMeter.svelte';
	import { indicatorNames, lab, meterValueText, trendText } from '$lib/content/lab';
	import { formatBillions } from '$lib/format/number';
	import { INDICATOR_MAX, type Indicators } from '$lib/sim';
	import { getSession } from '$lib/state/simulation.svelte';

	interface Props {
		compact?: boolean;
	}

	let { compact = false }: Props = $props();

	const session = getSession();
	const keys: readonly (keyof Indicators)[] = ['waterQuality', 'fish', 'floodRisk', 'economy'];

	const rows = $derived(
		keys.map((key) => {
			const value = session.latest.indicators[key];
			const previous = session.previous;
			const delta = previous === null ? null : value - previous.indicators[key];
			const rounded = delta === null ? 0 : Math.round(delta);
			return {
				key,
				label: indicatorNames[key],
				value,
				valueText: meterValueText(value, INDICATOR_MAX, delta),
				trend: delta === null ? null : rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat',
				deltaText: delta === null ? '' : `${trendText(delta)} ${lab.vsLastMonth}`
			} as const;
		})
	);
	const cash = $derived(session.state.cash);
</script>

<div class={compact ? 'grid grid-cols-2 gap-x-4 gap-y-2' : 'flex flex-col gap-4'}>
	{#each rows as row (row.key)}
		<IndicatorMeter
			label={row.label}
			value={row.value}
			max={INDICATOR_MAX}
			valueText={row.valueText}
			trend={row.trend}
			deltaText={row.deltaText}
			{compact}
		/>
	{/each}
	<p class="flex items-baseline justify-between gap-2 {compact ? 'col-span-2 text-sm' : ''}">
		<span class="font-medium">{lab.cash}</span>
		<span data-numeric>{cash === null ? lab.cashUnlimited : formatBillions(cash)}</span>
	</p>
</div>
