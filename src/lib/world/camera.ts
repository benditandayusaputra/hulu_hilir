import { LOD_NEAR_FROM, LOD_SEGMENT_FROM, WORLD_HEIGHT, WORLD_WIDTH, ZOOM_MAX } from './constants';

export interface CameraState {
	x: number;
	y: number;
	zoom: number;
}

export interface Viewport {
	width: number;
	height: number;
}

export interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

export type DetailLevel = 'far' | 'segment' | 'near';

export const worldRect: Rect = { x: 0, y: 0, width: WORLD_WIDTH, height: WORLD_HEIGHT };

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

export function fitZoom(view: Viewport, padding = 0): number {
	const width = Math.max(1, view.width - padding * 2);
	const height = Math.max(1, view.height - padding * 2);
	return Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
}

export function clampZoom(zoom: number, view: Viewport): number {
	const min = fitZoom(view);
	return clamp(zoom, min, Math.max(min, ZOOM_MAX));
}

function clampAxis(center: number, half: number, size: number): number {
	return half * 2 >= size ? size / 2 : clamp(center, half, size - half);
}

export function clampCamera(camera: CameraState, view: Viewport): CameraState {
	const zoom = clampZoom(camera.zoom, view);
	return {
		zoom,
		x: clampAxis(camera.x, view.width / 2 / zoom, WORLD_WIDTH),
		y: clampAxis(camera.y, view.height / 2 / zoom, WORLD_HEIGHT)
	};
}

export function screenToWorld(
	camera: CameraState,
	view: Viewport,
	px: number,
	py: number
): { x: number; y: number } {
	return {
		x: camera.x + (px - view.width / 2) / camera.zoom,
		y: camera.y + (py - view.height / 2) / camera.zoom
	};
}

export function worldToScreen(
	camera: CameraState,
	view: Viewport,
	x: number,
	y: number
): { x: number; y: number } {
	return {
		x: (x - camera.x) * camera.zoom + view.width / 2,
		y: (y - camera.y) * camera.zoom + view.height / 2
	};
}

export function zoomAround(
	camera: CameraState,
	view: Viewport,
	factor: number,
	px: number,
	py: number
): CameraState {
	const anchor = screenToWorld(camera, view, px, py);
	const zoom = clampZoom(camera.zoom * factor, view);
	return clampCamera(
		{
			zoom,
			x: anchor.x - (px - view.width / 2) / zoom,
			y: anchor.y - (py - view.height / 2) / zoom
		},
		view
	);
}

export function panBy(camera: CameraState, view: Viewport, dx: number, dy: number): CameraState {
	return clampCamera(
		{ zoom: camera.zoom, x: camera.x - dx / camera.zoom, y: camera.y - dy / camera.zoom },
		view
	);
}

export function frameRect(rect: Rect, view: Viewport, padding: number): CameraState {
	const width = Math.max(1, view.width - padding * 2);
	const height = Math.max(1, view.height - padding * 2);
	const zoom = Math.min(width / rect.width, height / rect.height);
	return clampCamera({ zoom, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }, view);
}

export function visibleRect(camera: CameraState, view: Viewport): Rect {
	const width = view.width / camera.zoom;
	const height = view.height / camera.zoom;
	return { x: camera.x - width / 2, y: camera.y - height / 2, width, height };
}

export function intersects(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export function expandRect(rect: Rect, margin: number, grid: number): Rect {
	const x = Math.floor((rect.x - margin) / grid) * grid;
	const y = Math.floor((rect.y - margin) / grid) * grid;
	const right = Math.ceil((rect.x + rect.width + margin) / grid) * grid;
	const bottom = Math.ceil((rect.y + rect.height + margin) / grid) * grid;
	return { x, y, width: right - x, height: bottom - y };
}

export function detailLevelOf(zoom: number): DetailLevel {
	if (zoom >= LOD_NEAR_FROM) return 'near';
	if (zoom >= LOD_SEGMENT_FROM) return 'segment';
	return 'far';
}

export function cameraTransform(camera: CameraState, view: Viewport): string {
	const tx = view.width / 2 - camera.x * camera.zoom;
	const ty = view.height / 2 - camera.y * camera.zoom;
	return `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${camera.zoom.toFixed(4)})`;
}
