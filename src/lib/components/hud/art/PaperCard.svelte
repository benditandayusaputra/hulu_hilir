<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="paper-card {className}">
	{@render children()}
</div>

<style>
	.paper-card {
		position: relative;
		padding: 1.25rem;
		color: var(--color-ink);
		text-shadow: none;
		background-color: var(--color-paper);
		background-image:
			radial-gradient(
				circle,
				color-mix(in oklab, var(--color-paper-edge) 22%, transparent) 0 0.6px,
				transparent 1px
			),
			linear-gradient(
				to bottom,
				transparent 70%,
				color-mix(in oklab, var(--color-paper-edge) 22%, transparent)
			);
		background-size:
			7px 9px,
			100% 100%;
		border: 2px solid var(--color-paper-edge);
		border-radius: 13px 11px 14px 12px;
		box-shadow:
			0 3px 0 var(--color-paper-edge),
			0 10px 20px rgb(59 42 34 / 0.14);
	}
</style>
