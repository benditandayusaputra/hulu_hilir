<svelte:options namespace="svg" />

<script lang="ts">
	import { fade } from 'svelte/transition';
	import { intersects, type DetailLevel, type Rect } from '$lib/world/camera';
	import {
		NEAR_CLOUD_OPACITY,
		RAIN_LOOP_SECONDS,
		RAIN_PATTERN_SCALE,
		RAIN_TILES,
		WEATHER_FADE_MS,
		WORLD_HEIGHT,
		WORLD_WIDTH
	} from '$lib/world/constants';
	import type { ResolvedDetail } from '$lib/world/detail';
	import { splashPoints, type SoakMark, type WeatherScene } from '$lib/world/weather';
	import { cloudShadow, clouds, worldPalette as p, worldStroke } from './art/symbols';

	interface Props {
		scene: WeatherScene;
		soak: readonly SoakMark[];
		level: DetailLevel;
		detail: ResolvedDetail;
		moving: boolean;
		cull: Rect;
	}

	let { scene, soak, level, detail, moving, cull }: Props = $props();

	const rainColor = '#E6F4FF';
	const veilDark = '#15253A';
	const veilWarm = '#FFC94D';
	const dropPath = 'M0 -12 C5 -5 8 -1 8 3 A8 8 0 0 1 -8 3 C-8 -1 -5 -5 0 -12 Z';
	const allSplashes = splashPoints();

	const scale = $derived(RAIN_PATTERN_SCALE[level]);
	const tile = $derived(RAIN_TILES[scene.rain ?? 'heavy']);
	const shift = $derived(
		scene.rain === 'extreme'
			? { x: tile.width * scale, y: tile.height * 2 * scale }
			: { x: 0, y: tile.height * scale }
	);
	const sheet = $derived.by((): Rect | null => {
		const bounds = scene.rainBounds;
		if (bounds === null) return null;
		return {
			x: bounds.x - shift.x,
			y: bounds.y - shift.y,
			width: bounds.width + shift.x,
			height: bounds.height + shift.y
		};
	});
	const raining = $derived(scene.rain !== null);
	const showSoak = $derived(raining && level !== 'far');
	const splashes = $derived(
		raining && level === 'near' && detail === 'full'
			? allSplashes.filter((point) =>
					intersects(cull, { x: point.x - 20, y: point.y - 10, width: 40, height: 20 })
				)
			: []
	);
	const visibleSoak = $derived(
		showSoak
			? soak.filter((point) =>
					intersects(cull, { x: point.x - 10, y: point.y - 14, width: 20, height: 28 })
				)
			: []
	);
</script>

<g pointer-events="none" data-moving={moving ? '' : undefined} class="world-weather">
	<rect
		x={-WORLD_WIDTH}
		y={-WORLD_HEIGHT}
		width={WORLD_WIDTH * 3}
		height={WORLD_HEIGHT * 3}
		class="world-veil"
		style:fill={scene.tint > 0 ? veilWarm : veilDark}
		style:opacity={scene.tint > 0 ? scene.tint : scene.dim}
	/>

	{#each visibleSoak as drop, order (drop.key)}
		<path
			d={dropPath}
			transform="translate({drop.x} {drop.y})"
			fill={p.waterLight}
			stroke={p.outline}
			stroke-width={worldStroke.small}
			class={detail === 'full' ? 'world-soak' : undefined}
			style:animation-delay="{-(order % 4) * 0.4}s"
		/>
	{/each}

	{#each splashes as splash, order (splash.key)}
		<ellipse
			cx={splash.x}
			cy={splash.y}
			rx="10"
			ry="3.5"
			fill="none"
			stroke={p.foam}
			stroke-width="2.5"
			class="world-rain-splash"
			style:animation-delay="{-(order % 5) * 0.22}s"
		/>
	{/each}

	{#each scene.clouds as cloud, order (cloud.key)}
		<g transition:fade={{ duration: WEATHER_FADE_MS }}>
			<use
				href="#{cloudShadow.id}"
				x={cloud.shadow.x}
				y={cloud.shadow.y}
				width={cloud.shadow.width}
				height={cloud.shadow.height}
				class="world-cloud-drift"
				style:animation-delay="{-order * 2.3}s"
			/>
		</g>
	{/each}

	{#if scene.rain !== null && sheet !== null}
		<g transition:fade={{ duration: WEATHER_FADE_MS }}>
			<defs>
				<pattern
					id="world-rain-pattern"
					width={tile.width}
					height={tile.height}
					patternUnits="userSpaceOnUse"
					patternTransform="scale({scale})"
				>
					<g stroke={rainColor} stroke-width="2.5" stroke-linecap="round" opacity="0.85">
						{#if scene.rain === 'extreme'}
							<path d="M3 2 l5 20 M15 26 l5 20" />
						{:else}
							<path d="M6 4 v24 M26 40 v24 M16 70 v14" />
						{/if}
					</g>
				</pattern>
				<clipPath id="world-rain-clip">
					{#each scene.clouds as cloud (cloud.key)}
						{#if cloud.rain !== null}
							<polygon points={cloud.rain.map((point) => `${point.x},${point.y}`).join(' ')} />
						{/if}
					{/each}
				</clipPath>
			</defs>
			<g clip-path="url(#world-rain-clip)" data-rain={scene.rain}>
				<rect
					x={sheet.x}
					y={sheet.y}
					width={sheet.width}
					height={sheet.height}
					fill="url(#world-rain-pattern)"
					class="world-rain"
					style:--rain-dx="{shift.x}px"
					style:--rain-dy="{shift.y}px"
					style:animation-duration="{RAIN_LOOP_SECONDS[scene.rain]}s"
				/>
			</g>
		</g>
	{/if}

	<g class="world-clouds" style:opacity={level === 'near' ? NEAR_CLOUD_OPACITY : 1}>
		{#each scene.clouds as cloud, order (cloud.key)}
			<g transition:fade={{ duration: WEATHER_FADE_MS }}>
				<use
					href="#{clouds[cloud.kind].id}"
					x={cloud.cloud.x}
					y={cloud.cloud.y}
					width={cloud.cloud.width}
					height={cloud.cloud.height}
					class="world-cloud-drift"
					style:animation-delay="{-order * 2.3}s"
				/>
			</g>
		{/each}
	</g>
</g>
