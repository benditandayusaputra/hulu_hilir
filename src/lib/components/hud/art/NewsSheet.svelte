<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		masthead: string;
		edition: string;
		children: Snippet;
		class?: string;
	}

	let { masthead, edition, children, class: className = '' }: Props = $props();
</script>

<div class="news-sheet {className}">
	<div class="news-head">
		<p class="news-masthead">{masthead}</p>
		<p class="news-edition">{edition}</p>
	</div>
	<div class="news-body">
		{@render children()}
	</div>
</div>

<style>
	.news-sheet {
		padding: 1.25rem 1.5rem 1.5rem;
		color: var(--color-news-ink);
		text-shadow: none;
		background-color: var(--color-newsprint);
		background-image:
			radial-gradient(
				circle,
				color-mix(in oklab, var(--color-news-ink) 7%, transparent) 0 0.7px,
				transparent 1.1px
			),
			radial-gradient(
				ellipse at center,
				transparent 60%,
				color-mix(in oklab, var(--color-news-ink) 8%, transparent)
			);
		background-size:
			5px 5px,
			100% 100%;
		border: 1.5px solid color-mix(in oklab, var(--color-news-ink) 30%, transparent);
		box-shadow:
			2px 3px 0 color-mix(in oklab, var(--color-news-ink) 18%, transparent),
			0 14px 28px rgb(0 0 0 / 0.25);
		transform: rotate(-0.8deg);
	}

	.news-head {
		padding-bottom: 0.5rem;
		margin-bottom: 0.75rem;
		text-align: center;
		border-bottom: 4px double var(--color-news-ink);
	}

	.news-masthead {
		font-family: var(--font-display);
		font-size: 2.1875rem;
		font-weight: 800;
		line-height: 1;
		letter-spacing: 0.04em;
	}

	.news-edition {
		margin-top: 0.375rem;
		padding-top: 0.25rem;
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		border-top: 1.5px solid var(--color-news-ink);
	}

	.news-body :global(h2),
	.news-body :global(h3) {
		margin-bottom: 0.5rem;
		font-size: 1.40625rem;
		font-weight: 800;
		line-height: 1.2;
	}

	@media (min-width: 40rem) {
		.news-body :global(.news-columns) {
			columns: 2;
			column-gap: 1.25rem;
			column-rule: 1.5px solid color-mix(in oklab, var(--color-news-ink) 35%, transparent);
		}
	}
</style>
