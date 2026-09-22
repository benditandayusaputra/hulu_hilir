<script lang="ts">
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import StatusChip from '$lib/components/ui/StatusChip.svelte';
	import Switch from '$lib/components/ui/Switch.svelte';
	import {
		causeSourceNames,
		fishGroupExamples,
		fishGroupNames,
		lab,
		parameterLabels,
		segmentLabel
	} from '$lib/content/lab';
	import { formatNumber, formatPercent, formatScore } from '$lib/format/number';
	import {
		classTwoStandard,
		fishGroups,
		loadParameters,
		qualityParameters,
		type LoadParameter
	} from '$lib/sim';
	import { settings } from '$lib/state/settings.svelte';
	import { getSession } from '$lib/state/simulation.svelte';

	const session = getSession();
	const TOP_SOURCES = 3;
	const PERCENT = 100;

	const index = $derived(session.focusedSegment);
	const segment = $derived(session.segmentAt(index));
	const worstParameter = $derived.by((): LoadParameter => {
		let worst: LoadParameter = loadParameters[0];
		let worstRatio = -1;
		for (const key of loadParameters) {
			const ratio = segment.concentrations[key] / classTwoStandard[key];
			if (ratio > worstRatio) {
				worst = key;
				worstRatio = ratio;
			}
		}
		return worst;
	});
	const causes = $derived(session.causesOf(index)[worstParameter].slice(0, TOP_SOURCES));
	const parameterRows = $derived(
		qualityParameters.map((key) => {
			const value = segment.concentrations[key];
			const standard = classTwoStandard[key];
			const meets = key === 'do' ? value >= standard : value <= standard;
			return {
				key,
				label: parameterLabels[key].label,
				unit: parameterLabels[key].unit,
				value: formatNumber(value, parameterLabels[key].digits),
				standard: formatNumber(standard, parameterLabels[key].digits),
				verdict: meets ? lab.meetsStandard : key === 'do' ? lab.belowStandard : lab.failsStandard
			};
		})
	);
</script>

<div class="flex flex-col gap-3">
	<div class="flex flex-wrap items-center gap-2">
		<h3 class="text-base font-semibold">{segmentLabel(index)}</h3>
		<StatusChip status={segment.status} />
		<StatusChip status={segment.floodStatus} />
	</div>
	<dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
		<dt class="font-medium">{lab.pollutionIndex}</dt>
		<dd data-numeric>{formatNumber(segment.pollutionIndex, 1)}</dd>
		<dt class="font-medium">{lab.flow}</dt>
		<dd data-numeric>{formatNumber(segment.flow, 1)} {lab.flowUnit}</dd>
		<dt class="font-medium">{lab.temperature}</dt>
		<dd data-numeric>{formatNumber(segment.temperature, 1)} {lab.temperatureUnit}</dd>
		<dt class="font-medium">{lab.litter}</dt>
		<dd data-numeric>{formatScore(segment.litter)} {lab.perHundred}</dd>
		<dt class="font-medium">{lab.sediment}</dt>
		<dd data-numeric>{formatNumber(segment.sediment, 2)}</dd>
		<dt class="font-medium">{lab.hyacinth}</dt>
		<dd data-numeric>{formatPercent(segment.hyacinth)}</dd>
	</dl>
	<Disclosure summary="{lab.sources}: {parameterLabels[worstParameter].short}" open={true}>
		<ul class="flex flex-col gap-1 text-sm">
			{#each causes as cause (`${cause.source}-${cause.segment}`)}
				<li class="flex justify-between gap-2">
					<span>
						{causeSourceNames[cause.source]}{#if cause.segment !== null}
							({segmentLabel(cause.segment)}){/if}
					</span>
					<span data-numeric>{formatPercent(cause.share)}</span>
				</li>
			{/each}
		</ul>
	</Disclosure>
	<Disclosure summary={lab.fishPerGroup} open={true}>
		<ul class="flex flex-col gap-1 text-sm">
			{#each fishGroups as group (group)}
				<li class="flex justify-between gap-2">
					<span
						>{fishGroupNames[group]}
						<span class="text-ink-muted">({fishGroupExamples[group]})</span></span
					>
					<span data-numeric>{formatScore(segment.fish[group] * PERCENT)} {lab.perHundred}</span>
				</li>
			{/each}
		</ul>
	</Disclosure>
	<Switch
		bind:checked={settings.scientificMode}
		label={lab.scientificMode}
		onchange={() => settings.save()}
	/>
	{#if settings.scientificMode}
		<div>
			<table class="w-full border-collapse text-sm">
				<caption class="mb-1 text-left font-medium">{lab.parametersCaption}</caption>
				<thead>
					<tr class="border-b-[1.5px] border-ink/10 text-left">
						<th scope="col" class="py-1 pr-2">{lab.parameterColumn}</th>
						<th scope="col" class="py-1 pr-2">{lab.valueColumn}</th>
						<th scope="col" class="py-1 pr-2">{lab.standardColumn}</th>
						<th scope="col" class="py-1">{lab.verdictColumn}</th>
					</tr>
				</thead>
				<tbody>
					{#each parameterRows as row (row.key)}
						<tr class="border-b border-ink/10 align-top">
							<th scope="row" class="py-1 pr-2 text-left font-medium">{row.label} ({row.unit})</th>
							<td data-numeric class="py-1 pr-2">{row.value}</td>
							<td data-numeric class="py-1 pr-2">{row.standard}</td>
							<td class="py-1">{row.verdict}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
