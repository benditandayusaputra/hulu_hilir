<script lang="ts">
	import Disclosure from '$lib/components/ui/Disclosure.svelte';
	import { formatScore } from '$lib/format/number';

	type LineStyle = 'solid' | 'dashed' | 'dotted' | 'dashdot';

	interface Series {
		id: string;
		label: string;
		values: readonly number[];
		style: LineStyle;
	}

	interface Standard {
		value: number;
		label: string;
	}

	interface Props {
		title: string;
		series: readonly Series[];
		xLabel: string;
		summary: string;
		seeDataLabel: string;
		yMin?: number;
		yMax?: number;
		standard?: Standard | null;
	}

	let {
		title,
		series,
		xLabel,
		summary,
		seeDataLabel,
		yMin = 0,
		yMax = 100,
		standard = null
	}: Props = $props();

	const HEIGHT = 240;
	const MARGIN = { top: 12, right: 112, bottom: 28, left: 40 };
	const Y_TICKS = 4;
	const X_TICK_TARGET = 6;
	const LABEL_GAP = 14;
	const DEFAULT_WIDTH = 640;

	const strokes = [
		'var(--color-primary)',
		'var(--color-leaf)',
		'var(--color-accent)',
		'var(--color-danger)'
	];
	const dashes: Record<LineStyle, string> = {
		solid: '',
		dashed: '8 5',
		dotted: '2 4',
		dashdot: '8 4 2 4'
	};

	let width = $state(DEFAULT_WIDTH);
	let dataOpen = $state(false);

	const innerWidth = $derived(Math.max(1, width - MARGIN.left - MARGIN.right));
	const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
	const pointCount = $derived(Math.max(1, ...series.map((item) => item.values.length)));

	function x(index: number): number {
		return MARGIN.left + (index / Math.max(1, pointCount - 1)) * innerWidth;
	}

	function y(value: number): number {
		const share = (value - yMin) / Math.max(1e-9, yMax - yMin);
		return MARGIN.top + (1 - Math.max(0, Math.min(1, share))) * innerHeight;
	}

	function pathOf(values: readonly number[]): string {
		return values
			.map(
				(value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`
			)
			.join(' ');
	}

	const yTicks = $derived(
		Array.from({ length: Y_TICKS + 1 }, (_, i) => yMin + ((yMax - yMin) * i) / Y_TICKS)
	);
	const xStep = $derived(Math.max(1, Math.ceil((pointCount - 1) / X_TICK_TARGET)));
	const xTicks = $derived(
		Array.from({ length: pointCount }, (_, i) => i).filter(
			(i) => i % xStep === 0 || i === pointCount - 1
		)
	);

	const labels = $derived.by(() => {
		const placed = series
			.map((item, order) => {
				const last = item.values[item.values.length - 1] ?? yMin;
				return { id: item.id, label: item.label, order, yPos: y(last) };
			})
			.sort((left, right) => left.yPos - right.yPos);
		for (let i = 1; i < placed.length; i += 1) {
			const previous = placed[i - 1];
			const current = placed[i];
			if (previous && current && current.yPos - previous.yPos < LABEL_GAP) {
				current.yPos = previous.yPos + LABEL_GAP;
			}
		}
		return placed;
	});

	const rows = $derived(
		Array.from({ length: pointCount }, (_, i) => ({
			index: i,
			values: series.map((item) => item.values[i])
		}))
	);
</script>

<figure class="flex flex-col gap-2" bind:clientWidth={width}>
	<figcaption class="text-sm text-ink-muted">{summary}</figcaption>
	<svg
		viewBox="0 0 {width} {HEIGHT}"
		height={HEIGHT}
		preserveAspectRatio="xMinYMin meet"
		aria-hidden="true"
		class="block w-full text-[13px]"
	>
		<g class="stroke-ink/10">
			{#each yTicks as tick (tick)}
				<line x1={MARGIN.left} x2={MARGIN.left + innerWidth} y1={y(tick)} y2={y(tick)} />
			{/each}
		</g>
		<g class="fill-ink-muted" text-anchor="end">
			{#each yTicks as tick (tick)}
				<text x={MARGIN.left - 6} y={y(tick)} dominant-baseline="middle">{formatScore(tick)}</text>
			{/each}
		</g>
		<g class="fill-ink-muted" text-anchor="middle">
			{#each xTicks as tick (tick)}
				<text x={x(tick)} y={HEIGHT - 8}>{tick}</text>
			{/each}
			<text
				x={MARGIN.left + innerWidth / 2}
				y={HEIGHT - 8}
				dx={innerWidth / 2 + 24}
				text-anchor="start"
			>
				{xLabel}
			</text>
		</g>
		{#if standard !== null}
			<line
				x1={MARGIN.left}
				x2={MARGIN.left + innerWidth}
				y1={y(standard.value)}
				y2={y(standard.value)}
				stroke="var(--color-danger)"
				stroke-width="1.5"
				stroke-dasharray="4 4"
			/>
			<text x={MARGIN.left + 4} y={y(standard.value) - 4} class="fill-danger">{standard.label}</text
			>
		{/if}
		{#each series as item, order (item.id)}
			<path
				d={pathOf(item.values)}
				fill="none"
				stroke={strokes[order % strokes.length]}
				stroke-width="2.5"
				stroke-dasharray={dashes[item.style]}
				stroke-linejoin="round"
				stroke-linecap="round"
			/>
		{/each}
		{#each labels as item (item.id)}
			<text
				x={x(pointCount - 1) + 8}
				y={item.yPos}
				dominant-baseline="middle"
				fill={strokes[item.order % strokes.length]}
				class="font-medium"
			>
				{item.label}
			</text>
		{/each}
	</svg>
	<Disclosure summary={seeDataLabel} bind:open={dataOpen}>
		<div>
			{#if dataOpen}
				<table class="w-full border-collapse text-sm">
					<caption class="mb-1 text-left font-medium">{title}</caption>
					<thead>
						<tr class="border-b-[1.5px] border-ink/10 text-left">
							<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{xLabel}</th>
							{#each series as item (item.id)}
								<th scope="col" class="py-1 pr-2 [overflow-wrap:anywhere]">{item.label}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each rows as row (row.index)}
							<tr class="border-b border-ink/10">
								<th scope="row" data-numeric class="py-1 pr-2 text-left font-medium">{row.index}</th
								>
								{#each row.values as value, i (i)}
									<td data-numeric class="py-1 pr-2"
										>{value === undefined ? '' : formatScore(value)}</td
									>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	</Disclosure>
</figure>
