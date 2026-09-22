<script lang="ts">
	import { formatNumber } from '$lib/format/number';

	interface Props {
		min: number;
		max: number;
		step?: number;
		value: number;
		unit?: string;
		label: string;
		valueText?: (value: number) => string;
		oninput?: (value: number) => void;
	}

	let {
		min,
		max,
		step = 1,
		value = $bindable(),
		unit = '',
		label,
		valueText,
		oninput
	}: Props = $props();

	const id = $props.id();
	const text = $derived(valueText ? valueText(value) : `${formatNumber(value)} ${unit}`.trim());
</script>

<div class="flex flex-col gap-1">
	<div class="flex items-baseline justify-between gap-3">
		<label for={id} class="font-medium">{label}</label>
		<output for={id} data-numeric class="text-sm text-ink-muted">{text}</output>
	</div>
	<input
		{id}
		type="range"
		{min}
		{max}
		{step}
		bind:value
		aria-valuetext={text}
		oninput={() => oninput?.(value)}
		class="h-6 w-full accent-primary"
	/>
</div>
