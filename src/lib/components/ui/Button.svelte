<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import { ui } from '$lib/content/ui';
	import VisuallyHidden from './VisuallyHidden.svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	interface Props extends Omit<HTMLButtonAttributes, 'disabled'> {
		variant?: Variant;
		size?: Size;
		loading?: boolean;
		unavailableReason?: string;
		icon?: Snippet;
		children: Snippet;
	}

	let {
		variant = 'primary',
		size = 'md',
		loading = false,
		unavailableReason = '',
		icon,
		children,
		onclick,
		...rest
	}: Props = $props();

	const variantClass: Record<Variant, string> = {
		primary: 'bg-primary text-on-primary border-transparent hover:brightness-110',
		secondary: 'bg-surface text-ink border-ink/10 hover:bg-surface-2',
		ghost: 'bg-transparent text-ink border-transparent hover:bg-surface-2',
		danger: 'bg-danger text-on-primary border-transparent hover:brightness-110'
	};

	const sizeClass: Record<Size, string> = {
		sm: 'min-h-9 px-3 text-sm',
		md: 'min-h-11 px-4 text-base',
		lg: 'min-h-14 px-6 text-lg'
	};

	const buttonId = $props.id();
	const reasonId = `${buttonId}-reason`;
	const blocked = $derived(loading || unavailableReason !== '');

	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (blocked) {
			event.preventDefault();
			return;
		}
		onclick?.(event);
	}
</script>

{#snippet control()}
	<button
		type="button"
		{...rest}
		aria-disabled={blocked ? 'true' : undefined}
		aria-busy={loading ? 'true' : undefined}
		aria-describedby={unavailableReason === '' ? undefined : reasonId}
		onclick={handleClick}
		class="inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] border-[1.5px] font-medium transition-[background-color,filter] duration-[var(--dur-fast)] ease-[var(--ease-out)] aria-disabled:cursor-not-allowed aria-disabled:opacity-60 {variantClass[
			variant
		]} {sizeClass[size]}"
	>
		{#if loading}
			<span
				class="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
				aria-hidden="true"
			></span>
			<VisuallyHidden>{ui.loading}</VisuallyHidden>
		{:else if icon}
			<span class="shrink-0" aria-hidden="true">{@render icon()}</span>
		{/if}
		{@render children()}
	</button>
{/snippet}

{#if unavailableReason === ''}
	{@render control()}
{:else}
	<span class="inline-flex flex-col items-start gap-1">
		{@render control()}
		<span id={reasonId} class="text-sm text-danger">{unavailableReason}</span>
	</span>
{/if}
