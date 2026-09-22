import {
	FISH_EXTINCTION_THRESHOLD,
	FISH_HYACINTH_PENALTY,
	FISH_IMMIGRATION_MIN_SUITABILITY,
	FISH_IMMIGRATION_RATE,
	FISH_INTERMEDIATE_COMPETITION,
	FISH_KILL_MIN_POPULATION,
	FISH_KILL_SUITABILITY,
	FISH_KILL_SURVIVAL,
	FISH_RETURN_THRESHOLD,
	FISH_SENSITIVE_CAPACITY_BASE,
	FISH_SENSITIVE_CAPACITY_SHADE,
	FISH_STRESS_MORTALITY,
	FISH_TEMPERATURE_LETHAL_OFFSET,
	INDICATOR_MAX,
	classTwoStandard,
	fishSpecs
} from './constants';
import { fishGroups, type FishGroup, type FishPopulation } from './types';

export interface HabitatInput {
	doDawn: number;
	chromium: number;
	tss: number;
	temperature: number;
	hyacinth: number;
}

export interface FishUpdate {
	fish: FishPopulation;
	killed: boolean;
	returned: boolean;
	sensitiveLost: boolean;
	extinct: FishGroup[];
}

function clamp01(value: number): number {
	return Math.min(1, Math.max(0, value));
}

function higherIsBetter(value: number, lethal: number, comfort: number): number {
	return clamp01((value - lethal) / (comfort - lethal));
}

function lowerIsBetter(value: number, comfort: number, lethal: number): number {
	return clamp01((lethal - value) / (lethal - comfort));
}

export function suitabilityOf(group: FishGroup, input: HabitatInput): number {
	const spec = fishSpecs[group];
	const chromiumStandard = classTwoStandard.chromium;
	const parts = [
		higherIsBetter(input.doDawn, spec.doLethal, spec.doComfort),
		lowerIsBetter(
			input.chromium,
			spec.chromiumComfortRatio * chromiumStandard,
			spec.chromiumLethalRatio * chromiumStandard
		),
		lowerIsBetter(input.tss, spec.tssComfort, spec.tssLethal),
		lowerIsBetter(
			input.temperature,
			spec.temperatureComfort,
			spec.temperatureComfort + FISH_TEMPERATURE_LETHAL_OFFSET
		)
	];
	return Math.min(...parts) * (1 - FISH_HYACINTH_PENALTY * input.hyacinth);
}

export function carryingCapacity(group: FishGroup, shade: number, tolerant: number): number {
	if (group === 'sensitive') {
		return FISH_SENSITIVE_CAPACITY_BASE + FISH_SENSITIVE_CAPACITY_SHADE * shade;
	}
	if (group === 'intermediate') return 1 - FISH_INTERMEDIATE_COMPETITION * tolerant;
	return 1;
}

export function nextPopulation(
	group: FishGroup,
	current: number,
	suitability: number,
	capacity: number,
	neighbours: number
): number {
	const spec = fishSpecs[group];
	const growth = spec.growth * current * (1 - current / capacity) * suitability;
	const stress = FISH_STRESS_MORTALITY * (1 - suitability) ** 2 * current;
	const immigration =
		suitability >= FISH_IMMIGRATION_MIN_SUITABILITY
			? FISH_IMMIGRATION_RATE * neighbours * suitability
			: 0;
	const next = current + growth - stress + immigration;
	if (next < FISH_EXTINCTION_THRESHOLD) return 0;
	return Math.min(1, next);
}

export function updateSegmentFish(
	current: FishPopulation,
	suitability: Record<FishGroup, number>,
	shade: number,
	upstream: FishPopulation | null,
	downstream: FishPopulation | null,
	sensitiveLost: boolean
): FishUpdate {
	const fish = { ...current };
	const extinct: FishGroup[] = [];
	let killed = false;
	for (const group of fishGroups) {
		const s = suitability[group];
		let population = current[group];
		if (s < FISH_KILL_SUITABILITY && population >= FISH_KILL_MIN_POPULATION) {
			population *= FISH_KILL_SURVIVAL;
			killed = true;
		}
		const neighbours = (upstream?.[group] ?? 0) + (downstream?.[group] ?? 0);
		const capacity = carryingCapacity(group, shade, current.tolerant);
		fish[group] = nextPopulation(group, population, s, capacity, neighbours);
		if (current[group] > 0 && fish[group] === 0) extinct.push(group);
	}
	const lostNow = sensitiveLost || fish.sensitive === 0;
	const returned = lostNow && fish.sensitive >= FISH_RETURN_THRESHOLD;
	return { fish, killed, returned, sensitiveLost: lostNow && !returned, extinct };
}

export function fishScore(fish: FishPopulation): number {
	return (
		INDICATOR_MAX *
		fishGroups.reduce((sum, group) => sum + fishSpecs[group].weight * fish[group], 0)
	);
}
