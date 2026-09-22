<script lang="ts">
	import CloudRain from '@lucide/svelte/icons/cloud-rain';
	import Sun from '@lucide/svelte/icons/sun';

	interface Props {
		rain: boolean;
		extreme: boolean;
		drought: boolean;
	}

	let { rain, extreme, drought }: Props = $props();

	const rainColumns = [4, 12, 20, 28, 36];
</script>

{#if rain || drought}
	<div aria-hidden="true" class="pointer-events-none absolute top-1 right-1 flex items-start gap-1">
		{#if rain}
			<span class="relative block size-10 text-ink-muted">
				<CloudRain size={24} class="absolute top-0 left-2" />
				<svg viewBox="0 0 40 24" class="absolute bottom-0 left-0 size-full">
					<g
						class="flow-particles"
						style="--flow-distance: 12px; --flow-duration: {extreme ? 0.6 : 1.2}s"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
					>
						{#each rainColumns as x (x)}
							<path d="M{x} 0 v6 M{x} 12 v6" />
						{/each}
					</g>
				</svg>
			</span>
		{/if}
		{#if drought}
			<Sun size={28} class="text-accent" />
		{/if}
	</div>
{/if}
