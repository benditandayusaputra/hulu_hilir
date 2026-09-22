import {
	BOD_ULTIMATE_FACTOR,
	DROUGHT_TEMPERATURE_GAIN,
	GREENBELT_SHADE,
	HYACINTH_REAERATION_LOSS,
	MG_PER_L_DIVISOR,
	MPN_PER_100ML_DIVISOR,
	REAERATION_COEFFICIENT,
	REAERATION_DEPTH_EXPONENT,
	REAERATION_THETA,
	REAERATION_VELOCITY_EXPONENT,
	REFERENCE_TEMPERATURE,
	SOD_PER_SEDIMENT_INDEX,
	STREETER_PHELPS_LIMIT_EPSILON,
	TEMPERATURE_SHADE_GAIN,
	TSS_SETTLING_VELOCITY,
	backgroundConcentration,
	bodDecay,
	chromiumBinding,
	coliformDecay,
	doSaturationPolynomial,
	nutrientUptake,
	segmentSpecs,
	type DecayRate
} from './constants';
import {
	loadParameters,
	type LoadParameter,
	type LoadVector,
	type SegmentIndex,
	type TileState
} from './types';

export interface SegmentPhysics {
	index: SegmentIndex;
	flow: number;
	travelTime: number;
	temperature: number;
	hyacinth: number;
	sediment: number;
	tssMultiplier: number;
	coliformMultiplier: number;
}

export interface RoutedLoads {
	mixed: LoadVector[];
	out: LoadVector[];
}

export interface OxygenResult {
	saturation: number;
	dissolved: number;
	reaeration: number;
}

export function temperatureCorrected(decay: DecayRate, temperature: number): number {
	return decay.rate * decay.theta ** (temperature - REFERENCE_TEMPERATURE);
}

export function doSaturationAt(temperature: number): number {
	const [a, b, c, d] = doSaturationPolynomial;
	return a + b * temperature + c * temperature ** 2 + d * temperature ** 3;
}

export function shadeOf(tiles: readonly TileState[], greenbeltMaturity: number): number {
	const near = tiles.filter((tile) => tile.position === 1);
	const forested = near.reduce(
		(sum, tile) => sum + (tile.landUse === 'forest' ? tile.forestMaturity : 0),
		0
	);
	const fromTiles = near.length === 0 ? 0 : forested / near.length;
	return Math.min(1, fromTiles + GREENBELT_SHADE * greenbeltMaturity);
}

export function segmentTemperature(index: SegmentIndex, shade: number, drought: boolean): number {
	const base = segmentSpecs[index].baseTemperature;
	return base + TEMPERATURE_SHADE_GAIN * (1 - shade) + (drought ? DROUGHT_TEMPERATURE_GAIN : 0);
}

export function reaerationRate(index: SegmentIndex, temperature: number, hyacinth: number): number {
	const spec = segmentSpecs[index];
	const base =
		(REAERATION_COEFFICIENT * spec.velocity ** REAERATION_VELOCITY_EXPONENT) /
		spec.depth ** REAERATION_DEPTH_EXPONENT;
	const corrected = base * REAERATION_THETA ** (temperature - REFERENCE_TEMPERATURE);
	return corrected * (1 - HYACINTH_REAERATION_LOSS * hyacinth);
}

export function decayRateOf(parameter: LoadParameter, physics: SegmentPhysics): number {
	switch (parameter) {
		case 'bod':
			return temperatureCorrected(bodDecay, physics.temperature);
		case 'fecalColiform':
			return temperatureCorrected(coliformDecay, physics.temperature);
		case 'tss':
			return TSS_SETTLING_VELOCITY / segmentSpecs[physics.index].depth;
		case 'nitrate':
		case 'phosphate':
			return temperatureCorrected(nutrientUptake, physics.temperature);
		case 'chromium':
			return temperatureCorrected(chromiumBinding, physics.temperature);
	}
}

function divisorOf(parameter: LoadParameter): number {
	return parameter === 'fecalColiform' ? MPN_PER_100ML_DIVISOR : MG_PER_L_DIVISOR;
}

export function mixConcentration(
	parameter: LoadParameter,
	upstreamFlow: number,
	upstreamConcentration: number,
	flow: number,
	load: number,
	background: number
): number {
	const added = flow - upstreamFlow;
	const blended = (upstreamFlow * upstreamConcentration + added * background) / flow;
	return blended + load / (divisorOf(parameter) * flow);
}

export function routeLoads(
	loads: readonly LoadVector[],
	physics: readonly SegmentPhysics[],
	background: LoadVector = backgroundConcentration
): RoutedLoads {
	const mixed: LoadVector[] = [];
	const out: LoadVector[] = [];
	physics.forEach((segment, i) => {
		const upstream = out[i - 1];
		const upstreamFlow = physics[i - 1]?.flow ?? 0;
		const load = loads[i];
		const mix = { ...background };
		const exit = { ...background };
		for (const key of loadParameters) {
			const before = mixConcentration(
				key,
				upstreamFlow,
				upstream?.[key] ?? 0,
				segment.flow,
				load?.[key] ?? 0,
				background[key]
			);
			const multiplier =
				key === 'tss'
					? segment.tssMultiplier
					: key === 'fecalColiform'
						? segment.coliformMultiplier
						: 1;
			mix[key] = before * multiplier;
			exit[key] = mix[key] * Math.exp(-decayRateOf(key, segment) * segment.travelTime);
		}
		mixed.push(mix);
		out.push(exit);
	});
	return { mixed, out };
}

export function streeterPhelpsDeficit(
	k1: number,
	k2: number,
	ultimateBod: number,
	inflowDeficit: number,
	sod: number,
	travelTime: number
): number {
	const bodTerm =
		Math.abs(k2 - k1) < STREETER_PHELPS_LIMIT_EPSILON
			? k1 * ultimateBod * travelTime * Math.exp(-k1 * travelTime)
			: ((k1 * ultimateBod) / (k2 - k1)) *
				(Math.exp(-k1 * travelTime) - Math.exp(-k2 * travelTime));
	return bodTerm + inflowDeficit * Math.exp(-k2 * travelTime) + sod * travelTime;
}

export function routeOxygen(
	mixedBod: readonly number[],
	physics: readonly SegmentPhysics[]
): OxygenResult[] {
	const results: OxygenResult[] = [];
	physics.forEach((segment, i) => {
		const saturation = doSaturationAt(segment.temperature);
		const upstreamFlow = physics[i - 1]?.flow ?? 0;
		const upstreamDo = results[i - 1]?.dissolved ?? saturation;
		const added = segment.flow - upstreamFlow;
		const mixedDo = (upstreamFlow * upstreamDo + added * saturation) / segment.flow;
		const inflowDeficit = Math.max(0, saturation - mixedDo);
		const k1 = temperatureCorrected(bodDecay, segment.temperature);
		const k2 = reaerationRate(segment.index, segment.temperature, segment.hyacinth);
		const sod = (SOD_PER_SEDIMENT_INDEX * segment.sediment) / segmentSpecs[segment.index].depth;
		const ultimateBod = BOD_ULTIMATE_FACTOR * (mixedBod[i] ?? 0);
		const deficit = streeterPhelpsDeficit(
			k1,
			k2,
			ultimateBod,
			inflowDeficit,
			sod,
			segment.travelTime
		);
		results.push({ saturation, dissolved: Math.max(0, saturation - deficit), reaeration: k2 });
	});
	return results;
}
