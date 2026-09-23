<script lang="ts">
	import IndicatorMeter from '$lib/components/ui/IndicatorMeter.svelte';
	import { indicatorNames, lab, meterValueText, trendText } from '$lib/content/lab';
	import { formatBillions } from '$lib/format/number';
	import { INDICATOR_MAX, type Indicators } from '$lib/sim';
	import { getSession } from '$lib/state/simulation.svelte';

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

<div class="grid grid-cols-2 gap-x-3 gap-y-1 md:flex md:flex-wrap md:items-center md:gap-x-5">
	{#each rows as row (row.key)}
		<div class="min-w-0 md:w-36">
			<IndicatorMeter
				label={row.label}
				value={row.value}
				max={INDICATOR_MAX}
				valueText={row.valueText}
				trend={row.trend}
				deltaText={row.deltaText}
				compact={true}
			/>
		</div>
	{/each}
	<p class="col-span-2 flex items-baseline gap-2 text-sm md:flex-col md:gap-0">
		<span class="font-medium">{lab.cash}</span>
		<span data-numeric class="font-semibold">
			{cash === null ? lab.cashUnlimited : formatBillions(cash)}
		</span>
	</p>
</div>
