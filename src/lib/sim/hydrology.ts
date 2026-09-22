import { DROUGHT_FLOW_FACTOR, SECONDS_PER_DAY, segmentSpecs } from './constants';
import { segmentIndices, type SegmentIndex } from './types';

const METERS_PER_KM = 1000;

export function segmentFlows(flowFactor: number, drought: boolean): number[] {
	const factor = flowFactor * (drought ? DROUGHT_FLOW_FACTOR : 1);
	let cumulative = 0;
	return segmentIndices.map((index) => {
		cumulative += segmentSpecs[index].baseFlow;
		return cumulative * factor;
	});
}

export function travelTimeDays(index: SegmentIndex): number {
	const spec = segmentSpecs[index];
	return (spec.lengthKm * METERS_PER_KM) / (SECONDS_PER_DAY * spec.velocity);
}
