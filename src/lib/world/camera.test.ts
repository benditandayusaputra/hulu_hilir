import { describe, expect, it } from 'vitest';
import {
	clampCamera,
	detailLevelOf,
	expandRect,
	fitZoom,
	frameRect,
	screenToWorld,
	visibleRect,
	worldToScreen,
	zoomAround,
	type Viewport
} from './camera';
import { LOD_NEAR_FROM, LOD_SEGMENT_FROM, WORLD_HEIGHT, WORLD_WIDTH, ZOOM_MAX } from './constants';

const desktop: Viewport = { width: 1440, height: 800 };
const phone: Viewport = { width: 390, height: 700 };

describe('kamera dunia', () => {
	it('zoom terjauh memperlihatkan seluruh dunia', () => {
		const zoom = fitZoom(desktop);
		expect(WORLD_WIDTH * zoom).toBeLessThanOrEqual(desktop.width + 1e-9);
		expect(WORLD_HEIGHT * zoom).toBeLessThanOrEqual(desktop.height + 1e-9);
	});

	it('membatasi zoom dan menjaga dunia tetap mengisi layar', () => {
		const tooFar = clampCamera({ x: -500, y: 9000, zoom: 0.01 }, phone);
		expect(tooFar.zoom).toBeCloseTo(fitZoom(phone));
		expect(tooFar.x).toBe(WORLD_WIDTH / 2);
		const tooClose = clampCamera({ x: -500, y: 9000, zoom: 50 }, phone);
		expect(tooClose.zoom).toBe(ZOOM_MAX);
		const view = visibleRect(tooClose, phone);
		expect(view.x).toBeCloseTo(0);
		expect(view.y + view.height).toBeCloseTo(WORLD_HEIGHT);
	});

	it('zoom di titik kursor menahan titik dunia di bawah kursor', () => {
		const camera = { x: 2000, y: 1500, zoom: 0.8 };
		const before = screenToWorld(camera, desktop, 300, 200);
		const after = zoomAround(camera, desktop, 1.5, 300, 200);
		const point = worldToScreen(after, desktop, before.x, before.y);
		expect(point.x).toBeCloseTo(300);
		expect(point.y).toBeCloseTo(200);
		expect(after.zoom).toBeCloseTo(1.2);
	});

	it('membingkai persegi di tengah layar', () => {
		const rect = { x: 1000, y: 400, width: 600, height: 300 };
		const camera = frameRect(rect, desktop, 40);
		const view = visibleRect(camera, desktop);
		expect(view.x).toBeLessThanOrEqual(rect.x);
		expect(view.x + view.width).toBeGreaterThanOrEqual(rect.x + rect.width);
		expect(camera.x).toBeCloseTo(1300);
	});

	it('memilih tingkat detail dari zoom', () => {
		expect(detailLevelOf(LOD_SEGMENT_FROM - 0.01)).toBe('far');
		expect(detailLevelOf(LOD_SEGMENT_FROM)).toBe('segment');
		expect(detailLevelOf(LOD_NEAR_FROM)).toBe('near');
	});

	it('membulatkan jendela culling ke grid agar tidak berubah tiap piksel', () => {
		const a = expandRect({ x: 101, y: 101, width: 300, height: 300 }, 0, 200);
		const b = expandRect({ x: 150, y: 150, width: 300, height: 300 }, 0, 200);
		expect(a).toEqual(b);
	});
});
