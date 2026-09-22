<script lang="ts" generics="T extends string">
	interface Option {
		value: T;
		label: string;
	}

	interface Props {
		options: readonly Option[];
		value: T;
		legend: string;
		onchange?: (value: T) => void;
	}

	let { options, value = $bindable(), legend, onchange }: Props = $props();

	const name = $props.id();

	function select(next: T): void {
		value = next;
		onchange?.(next);
	}
</script>

<fieldset class="flex flex-wrap items-center gap-2">
	<legend class="float-left mr-1 text-sm font-medium text-ink-muted">{legend}</legend>
	<div
		class="inline-flex rounded-[var(--radius-control)] border-[1.5px] border-ink/10 bg-surface-2 p-0.5"
	>
		{#each options as option (option.value)}
			<label class="relative cursor-pointer">
				<input
					type="radio"
					{name}
					value={option.value}
					checked={value === option.value}
					onchange={() => select(option.value)}
					class="peer absolute inset-0 m-0 size-full cursor-pointer opacity-0"
				/>
				<span
					class="block min-h-9 rounded-[6px] px-3 py-1.5 text-sm font-medium text-ink-muted peer-checked:bg-surface peer-checked:text-ink peer-checked:shadow-sm peer-focus-visible:shadow-[0_0_0_5px_var(--color-focus-halo)] peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus"
				>
					{option.label}
				</span>
			</label>
		{/each}
	</div>
</fieldset>
