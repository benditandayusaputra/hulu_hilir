<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLButtonAttributes, 'children' | 'aria-label'> {
		label: string;
		children: Snippet;
	}

	let { label, children, ...rest }: Props = $props();
</script>

<button type="button" class="round-button" aria-label={label} {...rest}>
	{@render children()}
</button>

<style>
	.round-button {
		display: inline-grid;
		place-items: center;
		width: 3.25rem;
		height: 3.25rem;
		color: var(--color-outline);
		background: radial-gradient(
			circle at 35% 30%,
			light-dark(#fffaf0, #efe2c4),
			light-dark(#f0ddb5, #d9c39a)
		);
		border: 3px solid var(--color-outline);
		border-radius: 9999px;
		box-shadow:
			inset 0 -3px 0 light-dark(#d8c39c, #bfa679),
			0 4px 0 var(--color-wood-dark);
		cursor: pointer;
		transition: transform var(--dur-fast) var(--ease-out);
	}

	.round-button:hover {
		transform: translateY(-1px);
	}

	.round-button:active {
		transform: translateY(3px);
		box-shadow: inset 0 -2px 0 light-dark(#d8c39c, #bfa679);
	}
</style>
