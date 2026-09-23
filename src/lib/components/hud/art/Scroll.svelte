<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="scroll {className}">
	<div class="scroll-paper">
		{@render children()}
	</div>
</div>

<style>
	.scroll {
		position: relative;
		padding-block: 0.75rem;
	}

	.scroll::before,
	.scroll::after {
		position: absolute;
		inset-inline: -0.75rem;
		height: 1.25rem;
		content: '';
		background: linear-gradient(
			var(--color-wood-edge),
			var(--color-wood-light) 40%,
			var(--color-wood-dark)
		);
		border: 3px solid var(--color-outline);
		border-radius: 9999px;
		box-shadow: 0 3px 0 rgb(59 42 34 / 0.3);
	}

	.scroll::before {
		top: 0;
	}

	.scroll::after {
		bottom: 0;
	}

	.scroll-paper {
		padding: 1.5rem 1.5rem 1.75rem;
		color: var(--color-ink);
		text-shadow: none;
		background-color: var(--color-paper);
		background-image:
			linear-gradient(
				to bottom,
				color-mix(in oklab, var(--color-paper-edge) 45%, transparent),
				transparent 12%,
				transparent 88%,
				color-mix(in oklab, var(--color-paper-edge) 45%, transparent)
			),
			radial-gradient(
				circle,
				color-mix(in oklab, var(--color-paper-edge) 22%, transparent) 0 0.6px,
				transparent 1px
			);
		background-size:
			100% 100%,
			7px 9px;
		border-inline: 2px solid var(--color-paper-edge);
	}
</style>
