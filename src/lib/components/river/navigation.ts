import { segmentIndices, type SegmentIndex } from '$lib/sim';
import { cellColumns, type CellColumn, type CellRef } from '$lib/state/simulation.svelte';

export interface NavigationKey {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
}

const firstSegment: SegmentIndex = 1;
const lastSegment: SegmentIndex = 6;
const firstColumn: CellColumn = 0;
const lastColumn: CellColumn = 4;

function shiftSegment(segment: SegmentIndex, delta: number): SegmentIndex {
	return segmentIndices.find((index) => index === segment + delta) ?? segment;
}

function shiftColumn(column: CellColumn, delta: number): CellColumn {
	return cellColumns.find((index) => index === column + delta) ?? column;
}

export function nextCell(cell: CellRef, input: NavigationKey): CellRef | null {
	const jump = input.ctrlKey || input.metaKey;
	switch (input.key) {
		case 'ArrowUp':
			return { segment: shiftSegment(cell.segment, -1), column: cell.column };
		case 'ArrowDown':
			return { segment: shiftSegment(cell.segment, 1), column: cell.column };
		case 'ArrowLeft':
			return { segment: cell.segment, column: shiftColumn(cell.column, -1) };
		case 'ArrowRight':
			return { segment: cell.segment, column: shiftColumn(cell.column, 1) };
		case 'Home':
			return jump
				? { segment: firstSegment, column: cell.column }
				: { segment: cell.segment, column: firstColumn };
		case 'End':
			return jump
				? { segment: lastSegment, column: cell.column }
				: { segment: cell.segment, column: lastColumn };
		default:
			return null;
	}
}
