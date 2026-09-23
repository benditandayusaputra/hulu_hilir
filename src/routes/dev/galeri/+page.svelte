<script lang="ts">
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Coins from '@lucide/svelte/icons/coins';
	import Fish from '@lucide/svelte/icons/fish';
	import WoodPlank from '$lib/components/hud/art/WoodPlank.svelte';
	import WorldArt from '$lib/components/world/art/WorldArt.svelte';
	import {
		factory,
		forestMature,
		house,
		riverPieces,
		worldPalette,
		type WorldSymbol
	} from '$lib/components/world/art/symbols';
	import { gallery } from '$lib/content/dev';
	import { waterStatusNames } from '$lib/content/lab';
	import type { WaterStatus } from '$lib/sim';

	const pixelsPerUnit = 2;
	const statuses: WaterStatus[] = ['good', 'light', 'moderate', 'heavy'];
	const worldAssets = [
		{ symbol: forestMature, name: gallery.assets.forestMature },
		{ symbol: house, name: gallery.assets.house },
		{ symbol: factory, name: gallery.assets.factory }
	];
</script>

<svelte:head>
	<title>{gallery.title}</title>
</svelte:head>

{#snippet art(symbol: WorldSymbol)}
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 {symbol.width} {symbol.height}"
		width={symbol.width * pixelsPerUnit}
		height={symbol.height * pixelsPerUnit}
		class="block h-auto max-w-full"
	>
		<use href="#{symbol.id}" width={symbol.width} height={symbol.height} />
	</svg>
{/snippet}

<WorldArt />

<WoodPlank class="mb-6 inline-block">
	<h1 class="text-2xl">{gallery.title}</h1>
</WoodPlank>
<p class="mb-10 max-w-[var(--measure-prose)] text-ink-muted">{gallery.intro}</p>

<section aria-labelledby="galeri-dunia" class="mb-12">
	<h2 id="galeri-dunia" class="mb-4 text-xl">{gallery.worldHeading}</h2>
	<ul class="flex flex-wrap items-end gap-6">
		{#each worldAssets as asset (asset.symbol.id)}
			<li>
				<figure>
					<div
						class="w-fit max-w-full rounded-[var(--radius-card)] border-[1.5px] border-ink/10 p-3"
						style:background-color={worldPalette.grassLight}
					>
						{@render art(asset.symbol)}
					</div>
					<figcaption class="mt-2 text-sm">
						<span class="font-semibold">{asset.name}</span>
						<span class="block text-ink-muted">
							{gallery.size(asset.symbol.width, asset.symbol.height)}
						</span>
					</figcaption>
				</figure>
			</li>
		{/each}
	</ul>
</section>

<section aria-labelledby="galeri-sungai" class="mb-12">
	<h2 id="galeri-sungai" class="mb-2 text-xl">{gallery.riverHeading}</h2>
	<p class="mb-4 max-w-[var(--measure-prose)] text-ink-muted">{gallery.riverIntro}</p>
	<ul class="flex flex-wrap gap-6">
		{#each statuses as status (status)}
			<li>
				<figure>
					<div
						class="w-fit max-w-full overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-ink/10"
					>
						{@render art(riverPieces[status])}
					</div>
					<figcaption class="mt-2 text-sm">
						<span class="font-semibold">{waterStatusNames[status]}</span>
						<span class="block text-ink-muted">{gallery.riverSigns[status]}</span>
					</figcaption>
				</figure>
			</li>
		{/each}
	</ul>
</section>

<section aria-labelledby="galeri-hud">
	<h2 id="galeri-hud" class="mb-2 text-xl">{gallery.hudHeading}</h2>
	<p class="mb-4 max-w-[var(--measure-prose)] text-ink-muted">{gallery.hudIntro}</p>
	<div class="flex flex-col items-start gap-6">
		<WoodPlank class="w-full">
			<div class="flex flex-wrap items-center gap-x-8 gap-y-2">
				<h3 class="text-lg">{gallery.plank.title}</h3>
				<p class="flex items-center gap-2 font-semibold" data-numeric>
					<Coins size={20} aria-hidden="true" />{gallery.plank.cash}
				</p>
				<p class="flex items-center gap-2 font-semibold">
					<CalendarDays size={20} aria-hidden="true" />{gallery.plank.month}
				</p>
				<p class="flex items-center gap-2 font-semibold" data-numeric>
					<Fish size={20} aria-hidden="true" />{gallery.plank.fish}
				</p>
			</div>
		</WoodPlank>
		<WoodPlank>
			<h3 class="text-lg">{gallery.plank.narrowTitle}</h3>
		</WoodPlank>
	</div>
</section>
