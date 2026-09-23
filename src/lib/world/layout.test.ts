import { describe, expect, it } from 'vitest';
import { intersects } from './camera';
import { RIVER_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from './constants';
import { centerline, plotRect, plots, riverLength, segments } from './layout';

const bankClearance = RIVER_WIDTH / 2 + 20;

describe('tata letak Dunia Sungai', () => {
	it('punya 24 lahan dengan ID yang sama dengan mesin', () => {
		const ids = plots.map((plot) => plot.id);
		expect(new Set(ids).size).toBe(24);
		expect(ids).toContain('S1-L1');
		expect(ids).toContain('S6-R2');
	});

	it('enam segmen berurutan menutup seluruh panjang sungai', () => {
		expect(segments.map((segment) => segment.index)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(segments[0]?.start).toBe(0);
		expect(segments[5]?.end).toBeCloseTo(riverLength);
		for (let i = 1; i < segments.length; i += 1) {
			expect(segments[i]?.start).toBeCloseTo(segments[i - 1]?.end ?? -1);
		}
	});

	it('sungai mengalir dari kiri atas ke kanan bawah di dalam dunia', () => {
		const first = centerline[0];
		const last = centerline[centerline.length - 1];
		expect(first?.x).toBeLessThan(WORLD_WIDTH / 4);
		expect(first?.y).toBeLessThan(WORLD_HEIGHT / 4);
		expect(last?.x).toBeGreaterThan(WORLD_WIDTH / 2);
		expect(last?.y).toBeGreaterThan(WORLD_HEIGHT * 0.75);
		for (const point of centerline) {
			expect(point.x).toBeGreaterThanOrEqual(0);
			expect(point.x).toBeLessThanOrEqual(WORLD_WIDTH);
			expect(point.y).toBeGreaterThanOrEqual(0);
			expect(point.y).toBeLessThanOrEqual(WORLD_HEIGHT);
		}
	});

	it('lahan tidak saling tumpang tindih dan tidak menimpa air', () => {
		const rects = plots.map(plotRect);
		for (let i = 0; i < rects.length; i += 1) {
			for (let j = i + 1; j < rects.length; j += 1) {
				const a = rects[i];
				const b = rects[j];
				if (a && b) expect(intersects(a, b), `${plots[i]?.id} dan ${plots[j]?.id}`).toBe(false);
			}
			const rect = rects[i];
			if (rect === undefined) continue;
			for (const point of centerline) {
				const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
				const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
				expect(Math.hypot(dx, dy), plots[i]?.id).toBeGreaterThan(bankClearance);
			}
			expect(rect.x).toBeGreaterThanOrEqual(0);
			expect(rect.y + rect.height).toBeLessThanOrEqual(WORLD_HEIGHT);
		}
	});
});
