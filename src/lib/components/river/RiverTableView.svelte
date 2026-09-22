<script lang="ts">
	import {
		floodStatusNames,
		lab,
		parameterLabels,
		segmentLabel,
		waterStatusNames
	} from '$lib/content/lab';
	import { formatCompact, formatNumber, formatScore } from '$lib/format/number';
	import { getSession } from '$lib/state/simulation.svelte';

	const session = getSession();

	const rows = $derived(
		session.state.segments.map((segment) => ({
			index: segment.index,
			status: waterStatusNames[segment.status],
			pollutionIndex: formatNumber(segment.pollutionIndex, 1),
			oxygen: formatNumber(segment.concentrations.do, parameterLabels.do.digits),
			bod: formatNumber(segment.concentrations.bod, parameterLabels.bod.digits),
			coliform: formatCompact(segment.concentrations.fecalColiform),
			litter: formatScore(segment.litter),
			fish: formatScore(session.fishScoreOf(segment.index)),
			flood: floodStatusNames[segment.floodStatus]
		}))
	);
</script>

<div class="flex flex-col gap-4">
	<p class="text-sm font-medium">{lab.tableCaption} {session.month}</p>
	<div class="grid gap-4 md:grid-cols-2">
		<table class="w-full border-collapse text-sm">
			<caption class="mb-1 text-left text-ink-muted">{lab.tableStatusCaption}</caption>
			<thead>
				<tr class="border-b-[1.5px] border-ink/10 text-left align-bottom">
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{lab.tableColumns.segment}</th>
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{lab.tableColumns.status}</th>
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]"
						>{lab.tableColumns.pollutionIndex}</th
					>
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{lab.tableColumns.fish}</th>
					<th scope="col" class="py-1 [overflow-wrap:anywhere]">{lab.tableColumns.floodRisk}</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.index)}
					<tr class="border-b border-ink/10 align-top">
						<th scope="row" class="py-1 pr-2 text-left font-medium">{segmentLabel(row.index)}</th>
						<td class="py-1 pr-2">{row.status}</td>
						<td data-numeric class="py-1 pr-2">{row.pollutionIndex}</td>
						<td data-numeric class="py-1 pr-2">{row.fish}</td>
						<td class="py-1">{row.flood}</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<table class="w-full border-collapse text-sm">
			<caption class="mb-1 text-left text-ink-muted">{lab.tableParameterCaption}</caption>
			<thead>
				<tr class="border-b-[1.5px] border-ink/10 text-left align-bottom">
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{lab.tableColumns.segment}</th>
					<th scope="col" class="py-1 pr-2"
						>{parameterLabels.do.short} ({parameterLabels.do.unit})</th
					>
					<th scope="col" class="py-1 pr-2"
						>{parameterLabels.bod.short} ({parameterLabels.bod.unit})</th
					>
					<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">
						{parameterLabels.fecalColiform.short} ({parameterLabels.fecalColiform.unit})
					</th>
					<th scope="col" class="py-1 [overflow-wrap:anywhere]">{lab.tableColumns.litter}</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as row (row.index)}
					<tr class="border-b border-ink/10 align-top">
						<th scope="row" class="py-1 pr-2 text-left font-medium">{segmentLabel(row.index)}</th>
						<td data-numeric class="py-1 pr-2">{row.oxygen}</td>
						<td data-numeric class="py-1 pr-2">{row.bod}</td>
						<td data-numeric class="py-1 pr-2">{row.coliform}</td>
						<td data-numeric class="py-1">{row.litter}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
