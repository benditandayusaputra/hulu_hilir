<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import CloudSun from '@lucide/svelte/icons/cloud-sun';
	import Sun from '@lucide/svelte/icons/sun';
	import { untrack } from 'svelte';
	import Coin from '$lib/components/hud/art/Coin.svelte';
	import StatusIcon from '$lib/components/hud/art/StatusIcon.svelte';
	import IndicatorMeter from '$lib/components/ui/IndicatorMeter.svelte';
	import { indicatorNames, lab, meterValueText, seasonNames, timeLabel } from '$lib/content/lab';
	import { formatBillions } from '$lib/format/number';
	import { INDICATOR_MAX, type Indicators } from '$lib/sim';
	import { getSession } from '$lib/state/simulation.svelte';

	const session = getSession();
	const keys: readonly (keyof Indicators)[] = ['waterQuality', 'fish', 'floodRisk', 'economy'];
	const CASH_COUNT_MS = 600;
	const seasonIcons = { wet: CloudRain, transition: CloudSun, dry: Sun };

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
				trend: delta === null ? null : rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
			} as const;
		})
	);
	const cash = $derived(session.state.cash);
	const timeText = $derived(
		timeLabel(session.calendar.yearNumber, session.calendar.date.month, session.month)
	);
	const SeasonIcon = $derived(seasonIcons[session.calendar.season]);

	let shownCash = $state(session.state.cash);

	$effect(() => {
		const target = cash;
		const from = untrack(() => shownCash);
		const reduced = document.documentElement.dataset['motion'] === 'reduced';
		if (target === null || from === null || from === target || reduced) {
			shownCash = target;
			return;
		}
		const start = performance.now();
		let frame = requestAnimationFrame(function count(now: number) {
			const progress = Math.min(1, (now - start) / CASH_COUNT_MS);
			shownCash = from + (target - from) * (1 - (1 - progress) ** 3);
			if (progress < 1) frame = requestAnimationFrame(count);
		});
		return () => cancelAnimationFrame(frame);
	});
</script>

<div class="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1.5 md:gap-x-5">
	<p class="flex items-center gap-2 max-md:text-sm">
		<Coin size={28} />
		<span class="flex flex-col leading-tight">
			<span class="text-sm font-semibold max-md:sr-only">{lab.cash}</span>
			<span data-numeric class="font-bold">
				{#if cash === null}
					{lab.cashUnlimited}
				{:else}
					<span aria-hidden="true">{formatBillions(shownCash ?? cash)}</span>
					<span class="sr-only">{formatBillions(cash)}</span>
				{/if}
			</span>
		</span>
	</p>
	<p class="flex items-center gap-2 font-bold max-md:text-sm">
		<SeasonIcon size={24} aria-hidden="true" class="shrink-0" />
		{seasonNames[session.calendar.season]}
	</p>
	<p class="flex items-center gap-2 font-bold max-md:text-sm">
		<CalendarDays size={24} aria-hidden="true" class="shrink-0" />
		<span data-numeric>{timeText}</span>
	</p>
	<ul class="grid w-full grid-cols-4 gap-x-3 gap-y-1 md:flex md:w-auto md:flex-wrap md:gap-x-5">
		{#each rows as row (row.key)}
			<li class="min-w-0 md:w-36">
				<IndicatorMeter
					label={row.label}
					value={row.value}
					max={INDICATOR_MAX}
					valueText={row.valueText}
					trend={row.trend}
					tone="var(--color-meter-{row.key})"
					compact={true}
				>
					{#snippet icon()}<StatusIcon kind={row.key} size={26} />{/snippet}
				</IndicatorMeter>
			</li>
		{/each}
	</ul>
</div>
