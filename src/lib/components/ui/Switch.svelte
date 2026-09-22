<script lang="ts">
	interface Props {
		checked: boolean;
		label: string;
		onchange?: (checked: boolean) => void;
	}

	let { checked = $bindable(), label, onchange }: Props = $props();

	const id = $props.id();

	function toggle(): void {
		checked = !checked;
		onchange?.(checked);
	}
</script>

<div class="flex items-center justify-between gap-3">
	<label for={id} id="{id}-label" class="cursor-pointer font-medium">{label}</label>
	<button
		{id}
		type="button"
		role="switch"
		aria-checked={checked}
		aria-labelledby="{id}-label"
		onclick={toggle}
		class="relative h-7 w-12 shrink-0 rounded-[var(--radius-chip)] border-[1.5px] border-ink/10 transition-[background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] {checked
			? 'bg-primary'
			: 'bg-ink/20'}"
	>
		<span
			aria-hidden="true"
			class="absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow transition-transform duration-[var(--dur-fast)] ease-[var(--ease-out)] {checked
				? 'translate-x-5'
				: 'translate-x-0'}"
		></span>
	</button>
</div>
