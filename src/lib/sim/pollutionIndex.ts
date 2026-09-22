import {
	INDICATOR_MAX,
	IP_LOG_MULTIPLIER,
	classTwoStandard,
	ipThresholds,
	segmentSpecs,
	waterQualityBreakpoints
} from './constants';
import {
	qualityParameters,
	segmentIndices,
	waterStatuses,
	type Concentrations,
	type QualityParameter,
	type WaterStatus
} from './types';

export function ratioOf(parameter: QualityParameter, value: number, doSaturation: number): number {
	const standard = classTwoStandard[parameter];
	if (parameter === 'do') {
		const denominator = doSaturation - standard;
		if (denominator <= 0) return 0;
		return Math.max(0, (doSaturation - value) / denominator);
	}
	return value / standard;
}

export function scaledRatio(ratio: number): number {
	return ratio > 1 ? 1 + IP_LOG_MULTIPLIER * Math.log10(ratio) : ratio;
}

export function pollutionIndexOf(concentrations: Concentrations, doSaturation: number): number {
	const ratios = qualityParameters.map((parameter) =>
		scaledRatio(ratioOf(parameter, concentrations[parameter], doSaturation))
	);
	const maximum = Math.max(...ratios);
	const average = ratios.reduce((sum, ratio) => sum + ratio, 0) / ratios.length;
	return Math.sqrt((maximum ** 2 + average ** 2) / 2);
}

export function statusOf(pollutionIndex: number): WaterStatus {
	for (const status of waterStatuses) {
		if (pollutionIndex <= ipThresholds[status]) return status;
	}
	return 'heavy';
}

export function statusRank(status: WaterStatus): number {
	return waterStatuses.indexOf(status);
}

export function waterQualityScore(pollutionIndex: number): number {
	const points = waterQualityBreakpoints;
	const first = points[0];
	const last = points[points.length - 1];
	if (!first || !last) return INDICATOR_MAX;
	if (pollutionIndex <= first[0]) return first[1];
	if (pollutionIndex >= last[0]) return last[1];
	for (let i = 1; i < points.length; i += 1) {
		const left = points[i - 1];
		const right = points[i];
		if (!left || !right || pollutionIndex > right[0]) continue;
		const fraction = (pollutionIndex - left[0]) / (right[0] - left[0]);
		return left[1] + (right[1] - left[1]) * fraction;
	}
	return last[1];
}

export function lengthWeightedAverage(values: readonly number[]): number {
	let total = 0;
	let weighted = 0;
	segmentIndices.forEach((index, i) => {
		const length = segmentSpecs[index].lengthKm;
		total += length;
		weighted += length * (values[i] ?? 0);
	});
	return weighted / total;
}

export function worstSegment(pollutionIndices: readonly number[]): number {
	let worst = 0;
	pollutionIndices.forEach((value, i) => {
		if (value > (pollutionIndices[worst] ?? 0)) worst = i;
	});
	return worst + 1;
}
