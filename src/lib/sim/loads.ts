import {
	BIOPORI_RUNOFF_REDUCTION,
	ILLEGAL_DUMPING_BOD,
	ILLEGAL_DUMPING_CHROMIUM,
	LANDSLIDE_TSS,
	SEAL_OUTLET_REDUCTION,
	interventionReductions,
	landUseSpecs
} from './constants';
import {
	loadParameters,
	segmentIndices,
	type CauseSource,
	type Intervention,
	type InterventionType,
	type LandUse,
	type LoadVector,
	type MonthEvent,
	type SegmentIndex,
	type TileState
} from './types';

export interface LoadEntry {
	source: CauseSource;
	segment: SegmentIndex;
	load: LoadVector;
}

export interface LoadContext {
	month: number;
	tssRainFactor: number;
	upkeepPaid: boolean;
	greenbeltMaturity: readonly number[];
	events: readonly MonthEvent[];
	sealedSegments: ReadonlySet<SegmentIndex>;
}

export const zeroLoad: LoadVector = {
	bod: 0,
	tss: 0,
	nitrate: 0,
	phosphate: 0,
	fecalColiform: 0,
	chromium: 0
};

export function isActive(intervention: Intervention, month: number, upkeepPaid: boolean): boolean {
	return upkeepPaid && intervention.activeFrom <= month;
}

export function hasActive(
	interventions: readonly Intervention[],
	type: InterventionType,
	month: number,
	upkeepPaid: boolean
): boolean {
	return interventions.some((item) => item.type === type && isActive(item, month, upkeepPaid));
}

function blend(open: number, mature: number, maturity: number): number {
	return open + (mature - open) * maturity;
}

export function baseLoadOf(landUse: LandUse, forestMaturity: number): LoadVector {
	const spec = landUseSpecs[landUse];
	if (landUse !== 'forest') return { ...pick(spec) };
	const open = landUseSpecs.open_land;
	const result = { ...zeroLoad };
	for (const key of loadParameters) result[key] = blend(open[key], spec[key], forestMaturity);
	return result;
}

function pick(spec: LoadVector): LoadVector {
	const result = { ...zeroLoad };
	for (const key of loadParameters) result[key] = spec[key];
	return result;
}

export function runoffOf(tile: TileState, month: number, upkeepPaid: boolean): number {
	const spec = landUseSpecs[tile.landUse];
	const base =
		tile.landUse === 'forest'
			? blend(landUseSpecs.open_land.runoff, spec.runoff, tile.forestMaturity)
			: spec.runoff;
	const biopori = hasActive(tile.interventions, 'biopori', month, upkeepPaid);
	return Math.max(0, base - (biopori ? BIOPORI_RUNOFF_REDUCTION : 0));
}

function applyReduction(load: LoadVector, type: InterventionType, strength: number): LoadVector {
	const reduction = interventionReductions[type];
	if (!reduction) return load;
	const result = { ...load };
	for (const key of loadParameters) {
		const share = reduction[key];
		if (share !== undefined) result[key] = load[key] * (1 - share * strength);
	}
	return result;
}

export function tileSource(tile: TileState, month: number, upkeepPaid: boolean): CauseSource {
	if (
		tile.landUse === 'factory' &&
		hasActive(tile.interventions, 'ipal_industrial', month, upkeepPaid)
	) {
		return 'treated_factory';
	}
	const settlement = tile.landUse === 'settlement' || tile.landUse === 'dense_settlement';
	if (settlement && hasActive(tile.interventions, 'ipal_communal', month, upkeepPaid)) {
		return 'treated_settlement';
	}
	return tile.landUse;
}

export function tileLoad(tile: TileState, context: LoadContext): LoadVector {
	let load = baseLoadOf(tile.landUse, tile.forestMaturity);
	load.tss *= context.tssRainFactor;
	for (const intervention of tile.interventions) {
		if (!isActive(intervention, context.month, context.upkeepPaid)) continue;
		load = applyReduction(load, intervention.type, 1);
	}
	const greenbelt = context.greenbeltMaturity[tile.segment - 1] ?? 0;
	if (greenbelt > 0) load = applyReduction(load, 'greenbelt', greenbelt);
	return load;
}

function eventEntries(context: LoadContext): LoadEntry[] {
	const entries: LoadEntry[] = [];
	for (const event of context.events) {
		if (event.segment === null) continue;
		if (event.type === 'illegal_dumping') {
			const keep = context.sealedSegments.has(event.segment) ? 1 - SEAL_OUTLET_REDUCTION : 1;
			entries.push({
				source: 'illegal_dumping',
				segment: event.segment,
				load: {
					...zeroLoad,
					bod: ILLEGAL_DUMPING_BOD * keep,
					chromium: ILLEGAL_DUMPING_CHROMIUM * keep
				}
			});
		}
		if (event.type === 'landslide') {
			entries.push({
				source: 'landslide',
				segment: event.segment,
				load: { ...zeroLoad, tss: LANDSLIDE_TSS }
			});
		}
	}
	return entries;
}

export function loadEntries(tiles: readonly TileState[], context: LoadContext): LoadEntry[] {
	const entries: LoadEntry[] = tiles.map((tile) => ({
		source: tileSource(tile, context.month, context.upkeepPaid),
		segment: tile.segment,
		load: tileLoad(tile, context)
	}));
	return entries.concat(eventEntries(context));
}

export function sumBySegment(entries: readonly LoadEntry[]): LoadVector[] {
	const totals: LoadVector[] = segmentIndices.map(() => ({ ...zeroLoad }));
	for (const entry of entries) {
		const total = totals[entry.segment - 1];
		if (!total) continue;
		for (const key of loadParameters) total[key] += entry.load[key];
	}
	return totals;
}
