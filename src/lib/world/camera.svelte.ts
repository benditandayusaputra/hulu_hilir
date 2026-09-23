import { getContext } from 'svelte';
import { loadGsap } from '$lib/motion/gsap';
import type { SegmentIndex, TileId } from '$lib/sim';
import {
	cameraTransform,
	clampCamera,
	detailLevelOf,
	fitZoom,
	frameRect,
	panBy,
	visibleRect,
	worldRect,
	zoomAround,
	type CameraState,
	type Viewport
} from './camera';
import {
	FIT_PADDING_PX,
	FLY_SECONDS,
	SEGMENT_PADDING_PX,
	WORLD_HEIGHT,
	WORLD_WIDTH,
	ZOOM_SEGMENT,
	ZOOM_STEP,
	ZOOM_TILE
} from './constants';
import { plotById, segmentLayout } from './layout';

export const cameraKey = Symbol('world-camera');

export function getCamera(): WorldCamera | null {
	return getContext<WorldCamera | undefined>(cameraKey) ?? null;
}

interface Tween {
	kill: () => void;
}

function prefersReducedMotion(): boolean {
	return document.documentElement.dataset['motion'] === 'reduced';
}

export class WorldCamera {
	view = $state<Viewport>({ width: 0, height: 0 });
	x = $state(WORLD_WIDTH / 2);
	y = $state(WORLD_HEIGHT / 2);
	zoom = $state(0.3);
	moving = $state(false);
	private tween: Tween | null = null;
	private flight = 0;

	current = $derived<CameraState>({ x: this.x, y: this.y, zoom: this.zoom });
	level = $derived(detailLevelOf(this.zoom));
	visible = $derived(visibleRect(this.current, this.view));
	transform = $derived(cameraTransform(this.current, this.view));
	ready = $derived(this.view.width > 0 && this.view.height > 0);
	atMinimum = $derived(this.zoom <= fitZoom(this.view) + 1e-6);

	setViewport(width: number, height: number): void {
		const first = !this.ready;
		this.view = { width, height };
		if (first) this.apply(frameRect(worldRect, this.view, FIT_PADDING_PX));
		else this.apply(this.current);
	}

	stop(): void {
		this.flight += 1;
		this.tween?.kill();
		this.tween = null;
		this.moving = false;
	}

	panBy(dx: number, dy: number): void {
		this.stop();
		this.apply(panBy(this.current, this.view, dx, dy));
	}

	zoomAt(factor: number, px: number, py: number): void {
		this.stop();
		this.apply(zoomAround(this.current, this.view, factor, px, py));
	}

	zoomIn(): Promise<void> {
		return this.flyTo(
			zoomAround(this.current, this.view, ZOOM_STEP, this.view.width / 2, this.view.height / 2)
		);
	}

	zoomOut(): Promise<void> {
		return this.flyTo(
			zoomAround(this.current, this.view, 1 / ZOOM_STEP, this.view.width / 2, this.view.height / 2)
		);
	}

	showAll(): Promise<void> {
		return this.flyTo(frameRect(worldRect, this.view, FIT_PADDING_PX));
	}

	flyToTile(id: TileId, close = false): Promise<void> {
		const plot = plotById(id);
		if (plot === null) return Promise.resolve();
		const zoom = close ? ZOOM_TILE : Math.max(this.zoom, ZOOM_SEGMENT);
		return this.flyTo({ x: plot.center.x, y: plot.center.y, zoom });
	}

	flyToSegment(index: SegmentIndex, close = false): Promise<void> {
		const layout = segmentLayout(index);
		if (close) return this.flyTo({ x: layout.anchor.x, y: layout.anchor.y, zoom: ZOOM_TILE });
		const framed = frameRect(layout.bounds, this.view, SEGMENT_PADDING_PX);
		const zoom = Math.max(framed.zoom, Math.min(this.zoom, ZOOM_TILE));
		return this.flyTo({ x: layout.anchor.x, y: layout.anchor.y, zoom });
	}

	async flyTo(target: CameraState): Promise<void> {
		if (!this.ready) return;
		const next = clampCamera(target, this.view);
		this.stop();
		if (prefersReducedMotion()) {
			this.apply(next);
			return;
		}
		const flight = this.flight;
		const gsap = await loadGsap();
		if (flight !== this.flight) return;
		const proxy = { ...this.current };
		this.moving = true;
		await new Promise<void>((resolve) => {
			this.tween = gsap.to(proxy, {
				x: next.x,
				y: next.y,
				zoom: next.zoom,
				duration: FLY_SECONDS,
				ease: 'power2.inOut',
				onUpdate: () => this.apply(proxy),
				onComplete: () => {
					this.tween = null;
					this.moving = false;
					resolve();
				},
				onInterrupt: () => resolve()
			});
		});
	}

	private apply(next: CameraState): void {
		const clamped = clampCamera(next, this.view);
		this.x = clamped.x;
		this.y = clamped.y;
		this.zoom = clamped.zoom;
	}
}
