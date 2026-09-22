<script lang="ts">
	import { ui } from '$lib/content/ui';
</script>

<svelte:head>
	<title>{ui.siteName}</title>
	<meta name="description" content={ui.tagline} />
</svelte:head>

<section class="max-w-[var(--measure-prose)]">
	<h1 class="text-2xl md:text-3xl">{ui.siteName}</h1>
	<p class="mt-3 text-lg text-ink-muted">{ui.tagline}</p>
</section>
