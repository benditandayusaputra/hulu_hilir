<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '' }: Props = $props();
</script>

<div class="wood-plank {className}">
	{@render children()}
</div>

<style>
	.wood-plank {
		--nail: radial-gradient(
			circle at 42% 40%,
			#eef1f2 0 1.2px,
			#aeb6ba 1.6px 3px,
			var(--color-outline) 3.2px 4.6px,
			transparent 5px
		);
		position: relative;
		padding: 0.875rem 1.75rem;
		color: var(--color-plank-ink);
		border: 3px solid var(--color-outline);
		border-radius: 14px 10px 13px 9px;
		background-color: var(--color-wood);
		background-image:
			var(--nail), var(--nail), var(--nail), var(--nail),
			radial-gradient(18px 6px at 76% 64%, var(--color-wood-grain) 0 45%, transparent 75%),
			radial-gradient(12px 4px at 18% 30%, var(--color-wood-grain) 0 45%, transparent 75%),
			repeating-linear-gradient(
				177deg,
				transparent 0 7px,
				var(--color-wood-grain) 7px 8.5px,
				transparent 8.5px 15px,
				var(--color-wood-light) 15px 17px,
				transparent 17px 23px
			),
			linear-gradient(var(--color-wood-light), var(--color-wood) 45%, var(--color-wood-dark));
		background-size:
			12px 12px,
			12px 12px,
			12px 12px,
			12px 12px,
			auto,
			auto,
			auto,
			auto;
		background-position:
			5px 5px,
			calc(100% - 5px) 5px,
			5px calc(100% - 5px),
			calc(100% - 5px) calc(100% - 5px),
			0 0,
			0 0,
			0 0,
			0 0;
		background-repeat:
			no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, no-repeat, repeat, no-repeat;
		box-shadow:
			inset 0 2px 0 var(--color-wood-edge),
			inset 0 -3px 0 var(--color-wood-dark),
			0 4px 0 rgb(59 42 34 / 0.35);
		text-shadow:
			0 1px 0 var(--color-outline),
			0 -1px 0 var(--color-outline),
			1px 0 0 var(--color-outline),
			-1px 0 0 var(--color-outline),
			0 2px 0 var(--color-outline);
	}

	.wood-plank :global(:is(h1, h2, h3)) {
		font-weight: 700;
		color: var(--color-plank-ink);
	}
</style>
