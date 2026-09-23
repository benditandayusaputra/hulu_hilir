<script lang="ts">
	import { untrack } from 'svelte';
	import WeatherOverlay from '$lib/components/river/WeatherOverlay.svelte';
	import { formatBillions } from '$lib/format/number';
	import { type TileSideKey } from '$lib/content/lab';
	import {
		buildCostOf,
		RIVER_TARGET,
		segmentIndices,
		waterStatuses,
		type SegmentIndex,
		type TileId
	} from '$lib/sim';
	import { settings } from '$lib/state/settings.svelte';
	import {
		cellTileId,
		getSession,
		WATER_COLUMN,
		type CellColumn,
		type CellRef
	} from '$lib/state/simulation.svelte';
	import { expandRect, type Rect } from '$lib/world/camera';
	import { getCamera } from '$lib/world/camera.svelte';
	import {
		CULL_GRID,
		CULL_MARGIN,
		DOUBLE_CLICK_ZOOM,
		DRAG_THRESHOLD_PX,
		WHEEL_ZOOM_RATE
	} from '$lib/world/constants';
	import { probeDevice, resolveWorldDetail, type DeviceProbe } from '$lib/world/detail';
	import { plotById, plots, segmentLayout } from '$lib/world/layout';
	import {
		EFFECT_MS,
		plotViews,
		segmentObjects,
		tileSignature,
		type WorldEffect
	} from '$lib/world/scene';
	import WorldBackdrop from './WorldBackdrop.svelte';
	import WorldOverlay from './WorldOverlay.svelte';
	import WorldPlots from './WorldPlots.svelte';
	import WorldRiver from './WorldRiver.svelte';
	import WorldSea from './WorldSea.svelte';

	interface Props {
		focused: CellRef | null;
		onselect: (cell: CellRef) => void;
	}

	let { focused, onselect }: Props = $props();

	const session = getSession();
	const found = getCamera();
	if (found === null) throw new Error('WorldCamera context missing');
	const camera = found;

	const CASH_RISE = 130;
	const MAX_BOUNCES = 4;

	let container = $state<HTMLDivElement | null>(null);
	let tabHidden = $state(false);
	let dragging = $state(false);
	let probe = $state<DeviceProbe | null>(null);
	let effects = $state<WorldEffect[]>([]);
	let bouncing = $state<readonly TileId[]>([]);
	let nextEffectId = 1;

	const detail = $derived(
		probe === null ? 'light' : resolveWorldDetail(settings.worldDetail, probe)
	);
	const paused = $derived(!session.playing || tabHidden);
	const cullKey = $derived.by(() => {
		const rect = expandRect(camera.visible, CULL_MARGIN, CULL_GRID);
		return `${rect.x} ${rect.y} ${rect.width} ${rect.height}`;
	});
	const cull = $derived.by((): Rect => {
		const [x = 0, y = 0, width = 0, height = 0] = cullKey.split(' ').map(Number);
		return { x, y, width, height };
	});

	const views = $derived(plotViews(session.state, session.calendar.date.month));
	const objects = $derived(segmentObjects(session.state));

	const selectedTile = $derived(session.selection === null ? null : cellTileId(session.selection));
	const selectedWater = $derived(
		session.selection !== null && session.selection.column === WATER_COLUMN
			? session.selection.segment
			: null
	);
	const focusedTile = $derived(focused === null ? null : cellTileId(focused));
	const focusedWater = $derived(
		focused !== null && focused.column === WATER_COLUMN ? focused.segment : null
	);

	const rain = $derived(
		session.latest.events.some(
			(event) => event.type === 'heavy_rain' || event.type === 'extreme_rain'
		)
	);
	const extreme = $derived(session.latest.events.some((event) => event.type === 'extreme_rain'));

	function reducedMotion(): boolean {
		return document.documentElement.dataset['motion'] === 'reduced';
	}

	const columnOfSide: Record<TileSideKey, CellColumn> = { L2: 0, L1: 1, R1: 3, R2: 4 };

	function spawn(make: (id: number) => WorldEffect): void {
		const id = nextEffectId;
		nextEffectId += 1;
		const created = make(id);
		effects = [...effects, created];
		setTimeout(() => {
			effects = effects.filter((item) => item.id !== id);
		}, EFFECT_MS[created.kind]);
	}

	function bounce(ids: TileId[]): void {
		bouncing = [...bouncing, ...ids];
		setTimeout(() => {
			bouncing = bouncing.filter((id) => !ids.includes(id));
		}, EFFECT_MS.bounce);
	}

	function segmentOf(value: string | undefined): SegmentIndex | null {
		return segmentIndices.find((index) => index === Number(value)) ?? null;
	}

	const pointers: Record<number, { x: number; y: number }> = {};
	let dragOrigin: { x: number; y: number } | null = null;
	let pressedTarget: Element | null = null;
	let pinchDistance = 0;

	function localPoint(event: PointerEvent | MouseEvent): { x: number; y: number } {
		const rect = container?.getBoundingClientRect();
		return { x: event.clientX - (rect?.left ?? 0), y: event.clientY - (rect?.top ?? 0) };
	}

	function pinchState(): { distance: number; middle: { x: number; y: number } } | null {
		const [first, second] = Object.values(pointers);
		if (first === undefined || second === undefined) return null;
		return {
			distance: Math.hypot(first.x - second.x, first.y - second.y),
			middle: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 }
		};
	}

	function handlePointerDown(event: PointerEvent): void {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		container?.setPointerCapture(event.pointerId);
		const point = localPoint(event);
		pointers[event.pointerId] = point;
		if (Object.keys(pointers).length === 1) {
			dragOrigin = point;
			pressedTarget = event.target instanceof Element ? event.target : null;
			dragging = false;
		} else {
			pressedTarget = null;
			dragging = true;
			pinchDistance = pinchState()?.distance ?? 0;
		}
	}

	function handlePointerMove(event: PointerEvent): void {
		const previous = pointers[event.pointerId];
		if (previous === undefined) return;
		const point = localPoint(event);
		const before = pinchState();
		pointers[event.pointerId] = point;
		if (Object.keys(pointers).length >= 2) {
			const after = pinchState();
			if (before === null || after === null || pinchDistance === 0) return;
			camera.zoomAt(after.distance / pinchDistance, after.middle.x, after.middle.y);
			camera.panBy(after.middle.x - before.middle.x, after.middle.y - before.middle.y);
			pinchDistance = after.distance;
			return;
		}
		if (!dragging && dragOrigin !== null) {
			const moved = Math.hypot(point.x - dragOrigin.x, point.y - dragOrigin.y);
			if (moved < DRAG_THRESHOLD_PX) return;
			dragging = true;
		}
		camera.panBy(point.x - previous.x, point.y - previous.y);
	}

	function select(target: Element | null): void {
		const plotElement = target?.closest('[data-plot]');
		if (plotElement instanceof SVGElement) {
			const layout = plots.find((plot) => plot.id === plotElement.dataset['plot']);
			if (layout !== undefined) {
				onselect({
					segment: layout.segment,
					column: columnOfSide[`${layout.side}${layout.position}`]
				});
				void camera.flyToTile(layout.id);
			}
			return;
		}
		const water = target?.closest('[data-water]');
		if (water instanceof SVGElement) {
			const segment = segmentOf(water.dataset['water']);
			if (segment !== null) {
				onselect({ segment, column: WATER_COLUMN });
				void camera.flyToSegment(segment);
			}
		}
	}

	function handlePointerUp(event: PointerEvent): void {
		if (pointers[event.pointerId] === undefined) return;
		delete pointers[event.pointerId];
		if (Object.keys(pointers).length === 0) {
			if (!dragging && event.type === 'pointerup') select(pressedTarget);
			dragging = false;
			dragOrigin = null;
			pressedTarget = null;
		} else {
			pinchDistance = pinchState()?.distance ?? 0;
		}
	}

	function handleDoubleClick(event: MouseEvent): void {
		const point = localPoint(event);
		camera.zoomAt(DOUBLE_CLICK_ZOOM, point.x, point.y);
	}

	$effect(() => {
		const element = container;
		if (element === null) return;
		const wheel = (event: WheelEvent) => {
			event.preventDefault();
			const point = localPoint(event);
			camera.zoomAt(Math.exp(-event.deltaY * WHEEL_ZOOM_RATE), point.x, point.y);
		};
		element.addEventListener('wheel', wheel, { passive: false });
		const observer = new ResizeObserver(([entry]) => {
			if (entry === undefined) return;
			camera.setViewport(entry.contentRect.width, entry.contentRect.height);
		});
		observer.observe(element);
		return () => {
			element.removeEventListener('wheel', wheel);
			observer.disconnect();
		};
	});

	$effect(() => {
		probe = probeDevice();
		const update = () => (tabHidden = document.hidden);
		update();
		document.addEventListener('visibilitychange', update);
		return () => document.removeEventListener('visibilitychange', update);
	});

	let signatures: Map<TileId, string> | null = null;
	$effect(() => {
		const tiles = session.state.tiles;
		const next = new Map(tiles.map((tile) => [tile.id, tileSignature(tile)]));
		untrack(() => {
			const previous = signatures;
			signatures = next;
			if (previous === null || reducedMotion()) return;
			const changed = tiles.filter((tile) => previous.get(tile.id) !== next.get(tile.id));
			if (changed.length === 0 || changed.length > MAX_BOUNCES) return;
			bounce(changed.map((tile) => tile.id));
			for (const tile of changed) {
				const plot = plotById(tile.id);
				if (plot !== null) {
					spawn((id) => ({ id, kind: 'dust', x: plot.center.x, y: plot.center.y + 30 }));
				}
			}
		});
	});

	let pendingCount: number | null = null;
	$effect(() => {
		const pending = session.pending;
		untrack(() => {
			const previous = pendingCount;
			pendingCount = pending.length;
			if (previous === null || pending.length <= previous) return;
			const action = pending[pending.length - 1];
			if (action === undefined || action.target === RIVER_TARGET) return;
			const tile = session.latest.tiles.find((item) => item.id === action.target) ?? null;
			const cost = buildCostOf(action.type, tile === null ? null : tile.landUse);
			if (cost <= 0) return;
			const place =
				tile !== null
					? plotById(tile.id)?.center
					: segmentLayout(segmentOf(action.target) ?? 1).anchor;
			if (place === undefined) return;
			spawn((id) => ({
				id,
				kind: 'cash',
				x: place.x,
				y: place.y - CASH_RISE,
				text: `−${formatBillions(cost)}`
			}));
		});
	});

	let lastMonth: number | null = null;
	$effect(() => {
		const month = session.month;
		untrack(() => {
			const previous = lastMonth;
			lastMonth = month;
			const before = session.previous;
			if (previous === null || month !== previous + 1 || before === null || reducedMotion()) return;
			for (const segment of session.latest.segments) {
				const old = before.segments[segment.index - 1];
				if (old === undefined) continue;
				if (waterStatuses.indexOf(segment.status) < waterStatuses.indexOf(old.status)) {
					const layout = segmentLayout(segment.index);
					spawn((id) => ({
						id,
						kind: 'jump',
						x: layout.anchor.x,
						y: layout.anchor.y,
						flow: layout.flow
					}));
				}
			}
		});
	});
</script>

<div
	bind:this={container}
	role="presentation"
	data-paused={paused ? '' : undefined}
	data-level={camera.level}
	data-zoom={camera.ready ? camera.zoom.toFixed(3) : undefined}
	data-center={camera.ready ? `${Math.round(camera.x)},${Math.round(camera.y)}` : undefined}
	class="world-stage absolute inset-0 touch-none overflow-hidden select-none {dragging
		? 'cursor-grabbing'
		: 'cursor-grab'}"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	ondblclick={handleDoubleClick}
>
	<svg aria-hidden="true" focusable="false" class="block size-full">
		{#if camera.ready}
			<g transform={camera.transform}>
				<WorldBackdrop />
				<WorldRiver
					segments={session.state.segments}
					bank={objects.bank}
					level={camera.level}
					{cull}
					{detail}
				/>
				<WorldSea />
				<WorldPlots
					{views}
					structures={objects.structures}
					rings={objects.rings}
					selected={selectedTile}
					focused={focusedTile}
					{bouncing}
					level={camera.level}
					{cull}
					{detail}
				/>
				<WorldOverlay
					segments={session.state.segments}
					level={camera.level}
					{selectedWater}
					{focusedWater}
					{effects}
				/>
			</g>
		{/if}
	</svg>
	<WeatherOverlay {rain} {extreme} drought={session.latest.droughtActive} />
</div>
