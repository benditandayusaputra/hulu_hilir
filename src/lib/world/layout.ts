import {
	segmentIndices,
	tilePositions,
	tileSides,
	type SegmentIndex,
	type TileId,
	type TilePosition,
	type TileSide
} from '$lib/sim';
import type { Rect } from './camera';
import {
	BOARD_ABOVE_RIVER,
	BOARD_UPSTREAM,
	PLOT_HEIGHT,
	PLOT_OFFSET_ABOVE,
	PLOT_OFFSET_BELOW,
	PLOT_STAGGER,
	PLOT_WIDTH,
	RIVER_WIDTH,
	SAMPLE_STEP
} from './constants';

export interface Point {
	x: number;
	y: number;
}

interface Run {
	kind: 'run';
	from: Point;
	to: Point;
	amplitude: number;
	waves: number;
}

interface Arc {
	kind: 'arc';
	center: Point;
	radius: number;
	start: number;
	end: number;
}

type Piece = Run | Arc;

const halfTurn = Math.PI / 2;

const pieces: readonly Piece[] = [
	{ kind: 'arc', center: { x: 500, y: 330 }, radius: 230, start: Math.PI, end: halfTurn },
	{ kind: 'run', from: { x: 500, y: 560 }, to: { x: 3250, y: 560 }, amplitude: 32, waves: 2 },
	{ kind: 'arc', center: { x: 3250, y: 1050 }, radius: 490, start: -halfTurn, end: halfTurn },
	{ kind: 'run', from: { x: 3250, y: 1540 }, to: { x: 750, y: 1540 }, amplitude: 32, waves: 2 },
	{ kind: 'arc', center: { x: 750, y: 2010 }, radius: 470, start: -halfTurn, end: -3 * halfTurn },
	{ kind: 'run', from: { x: 750, y: 2480 }, to: { x: 2850, y: 2480 }, amplitude: 30, waves: 2 }
];

interface AnchorSpec {
	piece: number;
	t: number;
}

const anchorSpecs: Record<SegmentIndex, AnchorSpec> = {
	1: { piece: 1, t: 0.25 },
	2: { piece: 1, t: 0.5 },
	3: { piece: 1, t: 0.75 },
	4: { piece: 3, t: 0.25 },
	5: { piece: 3, t: 0.75 },
	6: { piece: 5, t: 0.5 }
};

function pieceLength(piece: Piece): number {
	if (piece.kind === 'arc') return Math.abs(piece.end - piece.start) * piece.radius;
	return Math.hypot(piece.to.x - piece.from.x, piece.to.y - piece.from.y);
}

function pointOn(piece: Piece, t: number): Point {
	if (piece.kind === 'arc') {
		const angle = piece.start + (piece.end - piece.start) * t;
		return {
			x: piece.center.x + piece.radius * Math.cos(angle),
			y: piece.center.y + piece.radius * Math.sin(angle)
		};
	}
	const wiggle = piece.amplitude * Math.sin(2 * Math.PI * piece.waves * t) * Math.sin(Math.PI * t);
	return {
		x: piece.from.x + (piece.to.x - piece.from.x) * t,
		y: piece.from.y + (piece.to.y - piece.from.y) * t + wiggle
	};
}

function sample(): { points: Point[]; lengths: number[]; pieceStarts: number[] } {
	const points: Point[] = [];
	const lengths: number[] = [];
	const pieceStarts: number[] = [];
	let total = 0;
	for (const piece of pieces) {
		pieceStarts.push(points.length);
		const steps = Math.max(2, Math.ceil(pieceLength(piece) / SAMPLE_STEP));
		for (let step = points.length === 0 ? 0 : 1; step <= steps; step += 1) {
			const point = pointOn(piece, step / steps);
			const previous = points[points.length - 1];
			if (previous !== undefined) total += Math.hypot(point.x - previous.x, point.y - previous.y);
			points.push(point);
			lengths.push(total);
		}
	}
	return { points, lengths, pieceStarts };
}

const sampled = sample();

export const centerline: readonly Point[] = sampled.points;
export const riverLength = sampled.lengths[sampled.lengths.length - 1] ?? 0;

function round(value: number): number {
	return Math.round(value * 10) / 10;
}

export function pathOf(points: readonly Point[]): string {
	return points
		.map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`)
		.join(' ');
}

export function indexAt(distance: number): number {
	const target = Math.max(0, Math.min(riverLength, distance));
	let low = 0;
	let high = sampled.lengths.length - 1;
	while (low < high) {
		const middle = Math.floor((low + high) / 2);
		if ((sampled.lengths[middle] ?? 0) < target) low = middle + 1;
		else high = middle;
	}
	return low;
}

export function pointAt(distance: number): Point {
	return centerline[indexAt(distance)] ?? { x: 0, y: 0 };
}

export function tangentAt(distance: number): Point {
	const index = indexAt(distance);
	const before = centerline[Math.max(0, index - 1)] ?? { x: 0, y: 0 };
	const after = centerline[Math.min(centerline.length - 1, index + 1)] ?? { x: 0, y: 0 };
	const length = Math.hypot(after.x - before.x, after.y - before.y) || 1;
	return { x: (after.x - before.x) / length, y: (after.y - before.y) / length };
}

export function slice(from: number, to: number): Point[] {
	return centerline.slice(indexAt(from), indexAt(to) + 1);
}

export interface SegmentLayout {
	index: SegmentIndex;
	anchor: Point;
	flow: 1 | -1;
	start: number;
	end: number;
	path: string;
	board: Point;
	bounds: Rect;
}

export interface PlotLayout {
	id: TileId;
	segment: SegmentIndex;
	side: TileSide;
	position: TilePosition;
	center: Point;
	above: boolean;
}

function anchorDistance(spec: AnchorSpec): number {
	const start = sampled.pieceStarts[spec.piece] ?? 0;
	const next = sampled.pieceStarts[spec.piece + 1] ?? centerline.length - 1;
	const index = Math.round(start + (next - start) * spec.t);
	return sampled.lengths[index] ?? 0;
}

function flowOf(spec: AnchorSpec): 1 | -1 {
	const piece = pieces[spec.piece];
	if (piece === undefined || piece.kind !== 'run') return 1;
	return piece.to.x >= piece.from.x ? 1 : -1;
}

const anchorDistances = segmentIndices.map((index) => anchorDistance(anchorSpecs[index]));

function boundsOf(points: readonly Point[], extra: readonly Point[]): Rect {
	const all = [...points, ...extra];
	const margin = RIVER_WIDTH;
	const xs = all.map((point) => point.x);
	const ys = all.map((point) => point.y);
	const x = Math.min(...xs) - margin;
	const y = Math.min(...ys) - margin;
	return {
		x,
		y,
		width: Math.max(...xs) + margin - x,
		height: Math.max(...ys) + margin - y
	};
}

function plotCenter(anchor: Point, flow: 1 | -1, side: TileSide, position: TilePosition): Point {
	const leftIsUp = flow === 1;
	const above = side === 'L' ? leftIsUp : !leftIsUp;
	const offsets = above ? PLOT_OFFSET_ABOVE : PLOT_OFFSET_BELOW;
	const distance = position === 1 ? offsets.near : offsets.far;
	const along = (position === 1 ? -PLOT_STAGGER : PLOT_STAGGER) * flow;
	return { x: anchor.x + along, y: anchor.y + (above ? -distance : distance) };
}

export const plots: readonly PlotLayout[] = segmentIndices.flatMap((segment) => {
	const spec = anchorSpecs[segment];
	const anchor = pointAt(anchorDistance(spec));
	const flow = flowOf(spec);
	return tileSides.flatMap((side) =>
		tilePositions.map((position): PlotLayout => {
			const leftIsUp = flow === 1;
			return {
				id: `S${segment}-${side}${position}`,
				segment,
				side,
				position,
				center: plotCenter(anchor, flow, side, position),
				above: side === 'L' ? leftIsUp : !leftIsUp
			};
		})
	);
});

export const segments: readonly SegmentLayout[] = segmentIndices.map((index, order) => {
	const spec = anchorSpecs[index];
	const anchorAt = anchorDistances[order] ?? 0;
	const previous = anchorDistances[order - 1];
	const next = anchorDistances[order + 1];
	const start = previous === undefined ? 0 : (previous + anchorAt) / 2;
	const end = next === undefined ? riverLength : (anchorAt + next) / 2;
	const anchor = pointAt(anchorAt);
	const flow = flowOf(spec);
	const reach = slice(start - SAMPLE_STEP, end + SAMPLE_STEP);
	const own = plots.filter((plot) => plot.segment === index).map((plot) => plot.center);
	return {
		index,
		anchor,
		flow,
		start,
		end,
		path: pathOf(reach),
		board: { x: anchor.x - flow * BOARD_UPSTREAM, y: anchor.y - BOARD_ABOVE_RIVER },
		bounds: boundsOf([anchor], own)
	};
});

export const riverPath = pathOf(centerline);

export const shorePath =
	'M2690 6000 L2700 3000 L2760 2640 C2800 2420 2980 2270 3200 2180 C3500 2060 3800 2020 4000 2000 L8000 1960';
export const seaPath = `${shorePath} L8000 6000 Z`;

export function plotById(id: TileId): PlotLayout | null {
	return plots.find((plot) => plot.id === id) ?? null;
}

export function segmentLayout(index: SegmentIndex): SegmentLayout {
	const found = segments.find((segment) => segment.index === index);
	if (found === undefined) throw new Error('segment layout missing');
	return found;
}

export function plotRect(plot: PlotLayout): Rect {
	return {
		x: plot.center.x - PLOT_WIDTH / 2,
		y: plot.center.y - PLOT_HEIGHT / 2,
		width: PLOT_WIDTH,
		height: PLOT_HEIGHT
	};
}

export function reachPoint(segment: SegmentLayout, share: number, lateral: number): Point {
	const distance = segment.start + (segment.end - segment.start) * share;
	const point = pointAt(distance);
	const tangent = tangentAt(distance);
	return { x: point.x - tangent.y * lateral, y: point.y + tangent.x * lateral };
}
