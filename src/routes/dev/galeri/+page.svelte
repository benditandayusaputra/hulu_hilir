<script lang="ts">
	import Factory from '@lucide/svelte/icons/factory';
	import Maximize from '@lucide/svelte/icons/maximize';
	import Play from '@lucide/svelte/icons/play';
	import TreePine from '@lucide/svelte/icons/tree-pine';
	import Waves from '@lucide/svelte/icons/waves';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import { contrastRatio, parseRgb } from '$lib/color/contrast';
	import { contrastPairs } from '$lib/color/pairs';
	import Coin from '$lib/components/hud/art/Coin.svelte';
	import HotbarSlot from '$lib/components/hud/art/HotbarSlot.svelte';
	import NewsSheet from '$lib/components/hud/art/NewsSheet.svelte';
	import PaperCard from '$lib/components/hud/art/PaperCard.svelte';
	import RoundButton from '$lib/components/hud/art/RoundButton.svelte';
	import Scroll from '$lib/components/hud/art/Scroll.svelte';
	import StarStamp from '$lib/components/hud/art/StarStamp.svelte';
	import StatusIcon from '$lib/components/hud/art/StatusIcon.svelte';
	import WoodPlank from '$lib/components/hud/art/WoodPlank.svelte';
	import WorldArt from '$lib/components/world/art/WorldArt.svelte';
	import {
		beach,
		birdEgret,
		birdFlying,
		boat,
		city,
		denseSettlement,
		factory,
		fishSymbols,
		floodgate,
		forestStages,
		greenbelt,
		hills,
		houseVariants,
		hyacinth,
		ipal,
		mountains,
		openLand,
		paddyStages,
		plot,
		retentionPond,
		riverPieces,
		sea,
		settlement,
		signboard,
		wasteBank,
		waterItems,
		worldPalette,
		type WorldSymbol
	} from '$lib/components/world/art/symbols';
	import { gallery } from '$lib/content/dev';
	import { indicatorNames, waterStatusNames } from '$lib/content/lab';
	import { formatNumber } from '$lib/format/number';
	import { fishGroups, waterStatuses } from '$lib/sim';
	import RiverbankSample from './RiverbankSample.svelte';

	interface Entry {
		symbol: WorldSymbol;
		name: string;
		note?: string;
		centered?: boolean;
	}

	const { assets } = gallery;

	function floating(id: string, width: number, height: number): WorldSymbol {
		return { id, width, height };
	}

	const groups: { title: string; entries: Entry[] }[] = [
		{
			title: gallery.groups.land,
			entries: [
				{ symbol: plot, name: assets.plot },
				{ symbol: forestStages[0], name: assets.forestSeedling },
				{ symbol: forestStages[1], name: assets.forestYoung },
				{ symbol: forestStages[2], name: assets.forestTeen },
				{ symbol: forestStages[3], name: assets.forestMature },
				{ symbol: paddyStages.planted, name: assets.paddyPlanted },
				{ symbol: paddyStages.harvest, name: assets.paddyHarvest },
				{ symbol: houseVariants.cream, name: assets.houseCream },
				{ symbol: houseVariants.mint, name: assets.houseMint },
				{ symbol: houseVariants.peach, name: assets.housePeach },
				{ symbol: settlement, name: assets.settlement },
				{ symbol: denseSettlement, name: assets.denseSettlement },
				{ symbol: factory, name: assets.factory },
				{ symbol: openLand, name: assets.openLand }
			]
		},
		{
			title: gallery.groups.interventions,
			entries: [
				{ symbol: ipal, name: assets.ipal },
				{ symbol: wasteBank, name: assets.wasteBank },
				{ symbol: retentionPond, name: assets.retentionPond },
				{ symbol: greenbelt, name: assets.greenbelt },
				{ symbol: floodgate, name: assets.floodgate }
			]
		},
		{
			title: gallery.groups.water,
			entries: waterStatuses.map((status) => ({
				symbol: riverPieces[status],
				name: waterStatusNames[status],
				note: gallery.riverSigns[status]
			}))
		},
		{
			title: gallery.groups.life,
			entries: [
				...fishGroups.map((group) => ({ symbol: fishSymbols[group], name: gallery.fish[group] })),
				{ symbol: boat, name: assets.boat },
				{ symbol: hyacinth, name: assets.hyacinth },
				{ symbol: floating(waterItems.bottle, 32, 16), name: assets.bottle, centered: true },
				{ symbol: floating(waterItems.bag, 26, 24), name: assets.bag, centered: true },
				{ symbol: floating(waterItems.can, 22, 14), name: assets.can, centered: true },
				{ symbol: floating(waterItems.deadFish, 40, 26), name: assets.deadFish, centered: true },
				{ symbol: birdEgret, name: assets.birdEgret },
				{ symbol: birdFlying, name: assets.birdFlying }
			]
		},
		{
			title: gallery.groups.markers,
			entries: [{ symbol: signboard, name: assets.signboard }]
		},
		{
			title: gallery.groups.backdrop,
			entries: [
				{ symbol: mountains, name: assets.mountains },
				{ symbol: hills, name: assets.hills },
				{ symbol: city, name: assets.city },
				{ symbol: beach, name: assets.beach },
				{ symbol: sea, name: assets.sea }
			]
		}
	];

	const themes = ['light', 'dark'] as const;

	const slotKinds = ['normal', 'selected', 'unavailable'] as const;
	const slotIcons = { normal: TreePine, selected: Factory, unavailable: Waves };
	let chosenSlot = $state<(typeof slotKinds)[number]>('selected');

	let ratios = $state<Record<string, number>>({});

	$effect(() => {
		const measured: Record<string, number> = {};
		for (const element of document.querySelectorAll<HTMLElement>('[data-contrast]')) {
			const style = getComputedStyle(element);
			const foreground = parseRgb(style.color);
			const background = parseRgb(style.backgroundColor);
			const key = element.dataset['contrast'];
			if (foreground && background && key) measured[key] = contrastRatio(foreground, background);
		}
		ratios = measured;
	});

	function verdict(ratio: number | undefined, target: number): string {
		if (ratio === undefined) return gallery.contrastPending;
		const status = ratio >= target ? gallery.contrastPass : gallery.contrastFail;
		return `${formatNumber(ratio, 2)}:1, ${status}, ${gallery.contrastTarget(formatNumber(target, 1))}`;
	}
</script>

<svelte:head>
	<title>{gallery.title}</title>
</svelte:head>

{#snippet art(entry: Entry, pixelsPerUnit: number)}
	{@const { width, height, id } = entry.symbol}
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox={entry.centered
			? `${-width / 2} ${-height / 2} ${width} ${height}`
			: `0 0 ${width} ${height}`}
		width={width * pixelsPerUnit}
		height={height * pixelsPerUnit}
		class="block h-auto max-w-full"
	>
		{#if entry.centered}
			<use href="#{id}" />
		{:else}
			<use href="#{id}" {width} {height} />
		{/if}
	</svg>
{/snippet}

<WorldArt />

<WoodPlank class="mb-6 inline-block">
	<h1 class="text-2xl">{gallery.title}</h1>
</WoodPlank>
<p class="mb-10 max-w-[var(--measure-prose)] text-ink-muted">{gallery.intro}</p>

<section aria-labelledby="galeri-dunia" class="mb-14">
	<h2 id="galeri-dunia" class="mb-6 text-2xl">{gallery.worldHeading}</h2>
	{#each groups as group, groupIndex (group.title)}
		<section aria-labelledby="galeri-kelompok-{groupIndex}" class="mb-10">
			<h3 id="galeri-kelompok-{groupIndex}" class="mb-4 text-xl">{group.title}</h3>
			<ul class="flex flex-col gap-6">
				{#each group.entries as entry (entry.symbol.id)}
					<li>
						<figure>
							<figcaption class="mb-2 text-sm">
								<span class="font-semibold">{entry.name}</span>
								<span class="text-ink-muted">
									({gallery.size(entry.symbol.width, entry.symbol.height)})
								</span>
								{#if entry.note}
									<span class="block text-ink-muted">{entry.note}</span>
								{/if}
							</figcaption>
							<div class="flex flex-wrap items-end gap-4">
								{#each gallery.zooms as zoom (zoom.label)}
									<div class="max-w-full">
										<div
											class="w-fit max-w-full overflow-hidden rounded-[var(--radius-control)] border-[1.5px] border-ink/10"
											style:background-color={worldPalette.grassLight}
										>
											{@render art(entry, zoom.pixelsPerUnit)}
										</div>
										<p class="mt-1 text-sm text-ink-muted">{zoom.label}</p>
									</div>
								{/each}
							</div>
						</figure>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</section>

<section aria-labelledby="galeri-potongan" class="mb-14">
	<h2 id="galeri-potongan" class="mb-2 text-2xl">{gallery.sceneHeading}</h2>
	<p class="mb-4 max-w-[var(--measure-prose)] text-ink-muted">{gallery.sceneIntro}</p>
	<div
		class="w-fit max-w-full overflow-hidden rounded-[var(--radius-card)] border-[1.5px] border-ink/10"
	>
		<RiverbankSample />
	</div>
</section>

<section aria-labelledby="galeri-antarmuka">
	<h2 id="galeri-antarmuka" class="mb-2 text-2xl">{gallery.uiHeading}</h2>
	<p class="mb-6 max-w-[var(--measure-prose)] text-ink-muted">{gallery.uiIntro}</p>
	<div class="grid gap-6 xl:grid-cols-2">
		{#each themes as theme (theme)}
			<section
				aria-labelledby="galeri-tema-{theme}"
				data-theme={theme}
				class="flex min-w-0 flex-col gap-8 rounded-[var(--radius-card)] border-[1.5px] border-ink/10 bg-bg p-4 text-ink sm:p-6"
			>
				<h3 id="galeri-tema-{theme}" class="text-xl">{gallery.themes[theme]}</h3>

				<WoodPlank class="w-full">
					<div class="flex flex-wrap items-center gap-x-6 gap-y-3">
						<p class="flex items-center gap-2 font-bold" data-numeric>
							<Coin size={24} />
							<span class="sr-only">{gallery.hud.cashLabel}</span>
							{gallery.hud.cash}
						</p>
						<p class="font-semibold">{gallery.hud.month}</p>
						<ul class="flex flex-wrap gap-x-5 gap-y-2">
							{#each gallery.hud.meters as meter (meter.kind)}
								<li class="flex items-center gap-2">
									<StatusIcon kind={meter.kind} />
									<span class="sr-only">{indicatorNames[meter.kind]}</span>
									<span class="meter-track" aria-hidden="true">
										<span class="meter-fill meter-{meter.kind}" style:width="{meter.value}%"></span>
									</span>
									<span class="font-bold" data-numeric>{meter.value}</span>
								</li>
							{/each}
						</ul>
					</div>
				</WoodPlank>

				<div>
					<h4 class="mb-3 text-lg">{gallery.hotbarHeading}</h4>
					<div
						role="radiogroup"
						aria-label={gallery.hotbarHeading}
						class="flex flex-wrap gap-3 pt-3"
					>
						{#each slotKinds as kind (kind)}
							{@const slot = gallery.slots[kind]}
							{@const Icon = slotIcons[kind]}
							<HotbarSlot
								id="galeri-{theme}-{kind}"
								name="galeri-{theme}-slot"
								value={kind}
								checked={chosenSlot === kind}
								label={slot.label}
								cost={slot.cost}
								reason={kind === 'unavailable' ? gallery.slotReason : ''}
								onchange={() => (chosenSlot = kind)}
							>
								{#snippet icon()}<Icon size={24} aria-hidden="true" />{/snippet}
							</HotbarSlot>
						{/each}
					</div>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.roundHeading}</h4>
					<div class="flex flex-wrap gap-3">
						<RoundButton label={gallery.roundButtons.play}>
							<Play size={22} aria-hidden="true" />
						</RoundButton>
						<RoundButton label={gallery.roundButtons.zoomIn}>
							<ZoomIn size={22} aria-hidden="true" />
						</RoundButton>
						<RoundButton label={gallery.roundButtons.zoomOut}>
							<ZoomOut size={22} aria-hidden="true" />
						</RoundButton>
						<RoundButton label={gallery.roundButtons.overview}>
							<Maximize size={22} aria-hidden="true" />
						</RoundButton>
					</div>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.cardHeading}</h4>
					<PaperCard>
						<p class="font-display text-lg font-bold">{gallery.cardTitle}</p>
						<p class="mt-2">{gallery.cardBody}</p>
						<a
							href="#galeri-antarmuka"
							class="mt-2 inline-block font-semibold text-primary underline"
						>
							{gallery.cardLink}
						</a>
					</PaperCard>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.newsHeading}</h4>
					<WoodPlank nails={false} class="p-4 sm:p-6">
						<NewsSheet masthead={gallery.newsMasthead} edition={gallery.newsEdition}>
							<p class="mb-2 font-display text-xl font-extrabold">{gallery.newsHeadline}</p>
							<p class="news-columns">{gallery.newsBody}</p>
						</NewsSheet>
					</WoodPlank>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.scrollHeading}</h4>
					<div class="px-3">
						<Scroll>
							<p class="font-display text-lg font-bold">{gallery.scrollTitle}</p>
							<p class="mt-2">{gallery.scrollBody}</p>
						</Scroll>
					</div>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.stampHeading}</h4>
					<PaperCard class="flex items-center gap-4">
						<StarStamp stars={2} label={gallery.stampLabel(2)} size={104} />
						<p class="font-display text-lg font-bold">{gallery.stampTitle}</p>
					</PaperCard>
				</div>

				<div>
					<h4 class="mb-3 text-lg">{gallery.contrastHeading}</h4>
					<ul class="flex flex-col gap-2 text-sm">
						{#each contrastPairs as pair (pair.id)}
							<li class="flex flex-wrap items-center gap-x-3 gap-y-1">
								<span
									class="inline-grid h-8 w-12 shrink-0 place-items-center rounded-[var(--radius-control)] border-[1.5px] border-ink/10 font-bold"
									style:color="var({pair.fg})"
									style:background-color="var({pair.bg})"
									data-contrast="{theme}-{pair.id}">Aa</span
								>
								<span class="min-w-0 flex-1 basis-40">{gallery.pairs[pair.id]}</span>
								<span class="w-full font-semibold sm:w-auto" data-numeric>
									{verdict(ratios[`${theme}-${pair.id}`], pair.target)}
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</section>
		{/each}
	</div>
</section>

<style>
	.meter-track {
		display: inline-block;
		width: 4.5rem;
		height: 0.75rem;
		overflow: hidden;
		background: var(--color-wood-dark);
		border: 2px solid var(--color-outline);
		border-radius: 9999px;
	}

	.meter-fill {
		display: block;
		height: 100%;
		border-right: 2px solid var(--color-outline);
	}

	.meter-waterQuality {
		background: #5cc4e6;
	}

	.meter-fish {
		background: #f2a65a;
	}

	.meter-floodRisk {
		background: #e0735a;
	}

	.meter-economy {
		background: #f2b632;
	}
</style>
