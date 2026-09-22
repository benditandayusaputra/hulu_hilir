import type {
	ActionScope,
	ActionType,
	EventType,
	FishGroup,
	FloodStatus,
	InterventionType,
	LandUse,
	LoadParameter,
	LoadVector,
	QualityParameter,
	SegmentIndex,
	WaterStatus
} from './types';

export const ENGINE_VERSION = '1.0.0';

export const SEGMENT_COUNT = 6;
export const TILES_PER_SEGMENT = 4;
export const TILE_CATCHMENT_KM2 = 3;
export const SECONDS_PER_DAY = 86400;
export const MG_PER_L_DIVISOR = 86.4;
export const MPN_PER_100ML_DIVISOR = 8.64e8;
export const HOURS_PER_DAY = 24;
export const MONTHS_PER_YEAR = 12;

export interface SegmentSpec {
	lengthKm: number;
	velocity: number;
	depth: number;
	baseFlow: number;
	baseTemperature: number;
	channelCapacity: number;
}

export const segmentSpecs: Record<SegmentIndex, SegmentSpec> = {
	1: {
		lengthKm: 8,
		velocity: 1.0,
		depth: 0.5,
		baseFlow: 1.5,
		baseTemperature: 23,
		channelCapacity: 45
	},
	2: {
		lengthKm: 10,
		velocity: 0.8,
		depth: 0.8,
		baseFlow: 1.0,
		baseTemperature: 24,
		channelCapacity: 70
	},
	3: {
		lengthKm: 12,
		velocity: 0.6,
		depth: 1.2,
		baseFlow: 1.5,
		baseTemperature: 26,
		channelCapacity: 110
	},
	4: {
		lengthKm: 12,
		velocity: 0.5,
		depth: 1.8,
		baseFlow: 1.5,
		baseTemperature: 28,
		channelCapacity: 150
	},
	5: {
		lengthKm: 12,
		velocity: 0.35,
		depth: 2.5,
		baseFlow: 2.0,
		baseTemperature: 29,
		channelCapacity: 190
	},
	6: {
		lengthKm: 8,
		velocity: 0.25,
		depth: 3.0,
		baseFlow: 1.0,
		baseTemperature: 29,
		channelCapacity: 220
	}
};

export const classTwoStandard: Record<QualityParameter, number> = {
	do: 4,
	bod: 3,
	tss: 50,
	nitrate: 10,
	phosphate: 0.2,
	fecalColiform: 1000,
	chromium: 0.05
};

export const backgroundConcentration: Record<LoadParameter, number> = {
	bod: 1,
	tss: 10,
	nitrate: 0.5,
	phosphate: 0.03,
	fecalColiform: 50,
	chromium: 0
};

export interface LandUseSpec extends LoadVector {
	runoff: number;
	revenue: number;
	jobs: number;
	population: number;
	litter: number;
}

export const landUseSpecs: Record<LandUse, LandUseSpec> = {
	forest: {
		bod: 2,
		tss: 300,
		nitrate: 1,
		phosphate: 0.05,
		fecalColiform: 1e10,
		chromium: 0,
		runoff: 0.15,
		revenue: 0.05,
		jobs: 20,
		population: 0,
		litter: 0
	},
	paddy: {
		bod: 15,
		tss: 3000,
		nitrate: 30,
		phosphate: 3,
		fecalColiform: 5e10,
		chromium: 0,
		runoff: 0.3,
		revenue: 0.3,
		jobs: 150,
		population: 0,
		litter: 0
	},
	settlement: {
		bod: 200,
		tss: 1500,
		nitrate: 40,
		phosphate: 10,
		fecalColiform: 1e13,
		chromium: 0,
		runoff: 0.65,
		revenue: 0.4,
		jobs: 0,
		population: 5000,
		litter: 3
	},
	dense_settlement: {
		bod: 800,
		tss: 4000,
		nitrate: 160,
		phosphate: 40,
		fecalColiform: 4e13,
		chromium: 0,
		runoff: 0.75,
		revenue: 1.0,
		jobs: 0,
		population: 20000,
		litter: 8
	},
	factory: {
		bod: 800,
		tss: 800,
		nitrate: 20,
		phosphate: 5,
		fecalColiform: 1e11,
		chromium: 6,
		runoff: 0.8,
		revenue: 1.2,
		jobs: 800,
		population: 0,
		litter: 1
	},
	open_land: {
		bod: 1,
		tss: 20000,
		nitrate: 2,
		phosphate: 0.5,
		fecalColiform: 0,
		chromium: 0,
		runoff: 0.45,
		revenue: 0,
		jobs: 0,
		population: 0,
		litter: 0
	}
};

export const ECOTOURISM_REVENUE_BONUS = 0.3;
export const ECOTOURISM_JOBS_BONUS = 50;
export const ECO_FARMING_REVENUE_FACTOR = 0.9;
export const ENFORCEMENT_ECONOMY_PENALTY_PER_FACTORY = 0.02;
export const ENFORCEMENT_FINE_PER_FACTORY = 0.3;
export const ECONOMY_REVENUE_WEIGHT = 0.6;
export const ECONOMY_JOBS_WEIGHT = 0.4;

export const wetMonths: readonly number[] = [11, 12, 1, 2, 3];
export const dryMonths: readonly number[] = [5, 6, 7, 8, 9];
export const tssRainFactor = { wet: 2.0, transition: 1.0, dry: 0.2 } as const;
export const cloudCoverBySeason = { wet: 0.7, transition: 0.5, dry: 0.3 } as const;
export const CLOUD_COVER_DAILY_VARIATION = 0.15;

export const flowFactorByMonth: readonly number[] = [
	1.8, 1.9, 1.6, 1.2, 0.9, 0.7, 0.55, 0.45, 0.5, 0.7, 1.2, 1.6
];
export const heavyRainChanceByMonth: readonly number[] = [
	0.55, 0.6, 0.45, 0.25, 0.1, 0.05, 0.03, 0.03, 0.05, 0.15, 0.35, 0.5
];
export const HIGH_FLOW_FACTOR_THRESHOLD = 1.6;

export interface DecayRate {
	rate: number;
	theta: number;
}

export const REFERENCE_TEMPERATURE = 20;
export const bodDecay: DecayRate = { rate: 0.23, theta: 1.047 };
export const coliformDecay: DecayRate = { rate: 0.8, theta: 1.07 };
export const nutrientUptake: DecayRate = { rate: 0.05, theta: 1.02 };
export const chromiumBinding: DecayRate = { rate: 0.02, theta: 1.0 };
export const TSS_SETTLING_VELOCITY = 1.0;
export const REAERATION_COEFFICIENT = 3.93;
export const REAERATION_VELOCITY_EXPONENT = 0.5;
export const REAERATION_DEPTH_EXPONENT = 1.5;
export const REAERATION_THETA = 1.024;
export const HYACINTH_REAERATION_LOSS = 0.6;
export const doSaturationPolynomial = [14.652, -0.41022, 0.007991, -0.000077774] as const;
export const BOD_ULTIMATE_FACTOR = 1.46;
export const STREETER_PHELPS_LIMIT_EPSILON = 0.001;
export const SOD_PER_SEDIMENT_INDEX = 2.0;
export const TEMPERATURE_SHADE_GAIN = 1.5;
export const DROUGHT_TEMPERATURE_GAIN = 1.0;
export const DROUGHT_FLOW_FACTOR = 0.6;
export const GREENBELT_SHADE = 0.5;

export const IP_LOG_MULTIPLIER = 5;
export const ipThresholds: Record<WaterStatus, number> = {
	good: 1,
	light: 5,
	moderate: 10,
	heavy: Number.POSITIVE_INFINITY
};
export const waterQualityBreakpoints: readonly (readonly [number, number])[] = [
	[0, 100],
	[1, 75],
	[5, 45],
	[10, 20],
	[20, 0]
];

export interface FishSpec {
	doComfort: number;
	doLethal: number;
	chromiumComfortRatio: number;
	chromiumLethalRatio: number;
	tssComfort: number;
	tssLethal: number;
	temperatureComfort: number;
	growth: number;
	weight: number;
}

export const fishSpecs: Record<FishGroup, FishSpec> = {
	sensitive: {
		doComfort: 6,
		doLethal: 3,
		chromiumComfortRatio: 0.5,
		chromiumLethalRatio: 2,
		tssComfort: 40,
		tssLethal: 150,
		temperatureComfort: 27,
		growth: 0.15,
		weight: 0.5
	},
	intermediate: {
		doComfort: 4,
		doLethal: 2,
		chromiumComfortRatio: 1,
		chromiumLethalRatio: 4,
		tssComfort: 80,
		tssLethal: 300,
		temperatureComfort: 30,
		growth: 0.25,
		weight: 0.35
	},
	tolerant: {
		doComfort: 1.5,
		doLethal: 0.3,
		chromiumComfortRatio: 2,
		chromiumLethalRatio: 10,
		tssComfort: 300,
		tssLethal: 1000,
		temperatureComfort: 33,
		growth: 0.35,
		weight: 0.15
	}
};
export const FISH_TEMPERATURE_LETHAL_OFFSET = 4;
export const FISH_HYACINTH_PENALTY = 0.5;
export const FISH_STRESS_MORTALITY = 0.6;
export const FISH_SENSITIVE_CAPACITY_BASE = 0.7;
export const FISH_SENSITIVE_CAPACITY_SHADE = 0.3;
export const FISH_INTERMEDIATE_COMPETITION = 0.3;
export const FISH_IMMIGRATION_RATE = 0.03;
export const FISH_IMMIGRATION_MIN_SUITABILITY = 0.5;
export const FISH_EXTINCTION_THRESHOLD = 0.01;
export const FISH_KILL_SUITABILITY = 0.15;
export const FISH_KILL_MIN_POPULATION = 0.2;
export const FISH_KILL_SURVIVAL = 0.2;
export const FISH_RETURN_THRESHOLD = 0.3;
export const INITIAL_FISH_POPULATION = 0.5;

export const RATIONAL_METHOD_COEFFICIENT = 0.278;
export const FLOOD_ATTENUATION = 0.85;
export const RETENTION_POND_REDUCTION = 25;
export const CAPACITY_SEDIMENT_LOSS = 0.35;
export const CAPACITY_LITTER_LOSS = 0.25;
export const CAPACITY_HYACINTH_LOSS = 0.2;
export const HEAVY_RAIN_INTENSITY = 40;
export const EXTREME_RAIN_INTENSITY = 70;
export const floodRatioThresholds: Record<FloodStatus, number> = {
	safe: 0.8,
	alert: 1.0,
	minor: 1.3,
	major: Number.POSITIVE_INFINITY
};
export const FLOOD_RISK_OFFSET = 0.5;
export const FLOOD_RISK_SCALE = 1.0;
export const FLOOD_RESIDENT_FACTOR = 2;
export const FLOOD_LITTER_TRANSFER = 0.5;
export const FLOOD_SEDIMENT_GAIN = 0.05;
export const FLOOD_TSS_MULTIPLIER = 1.5;
export const FLOOD_COLIFORM_MULTIPLIER = 2;
export const FLOOD_LOSS_PER_TILE = 0.5;
export const ROB_FLOOD_EQUIVALENT_RATIO = 1.1;

export const SEDIMENT_GAIN_PER_SETTLED_TSS = 0.01;
export const SEDIMENT_SETTLED_TSS_UNIT = 50;
export const SEDIMENT_LANDSLIDE_GAIN = 0.1;
export const SEDIMENT_HIGH_FLOW_LOSS = 0.02;
export const SEDIMENT_DREDGING_LOSS = 0.6;
export const DREDGING_TSS_MULTIPLIER = 1.5;
export const INITIAL_SEDIMENT = 0.1;
export const LITTER_MAX = 100;
export const LITTER_WASTE_BANK_FACTOR = 0.3;
export const LITTER_DOWNSTREAM_SHARE = 0.1;
export const LITTER_CLEANUP = 40;
export const LITTER_COMMUNITY_CLEANUP = 15;
export const HYACINTH_GROWTH = 0.15;
export const HYACINTH_DECLINE = 0.1;
export const HYACINTH_CLEARING = 0.7;
export const HYACINTH_PHOSPHATE_THRESHOLD = 0.3;
export const HYACINTH_VELOCITY_THRESHOLD = 0.5;
export const HYACINTH_BLOOM_THRESHOLD = 0.5;
export const FOREST_MATURITY_MONTHS = 30;
export const GREENBELT_MATURITY_MONTHS = 12;

export interface ActionSpec {
	scope: ActionScope;
	buildCost: number;
	upkeep: number;
	leadMonths: number;
	landUses: readonly LandUse[] | null;
	labOnly: boolean;
}

const anyLandUse = null;

export const actionSpecs: Record<ActionType, ActionSpec> = {
	plant_forest: {
		scope: 'tile',
		buildCost: 2.0,
		upkeep: 0.02,
		leadMonths: 0,
		landUses: ['open_land', 'paddy'],
		labOnly: false
	},
	ipal_industrial: {
		scope: 'tile',
		buildCost: 8.0,
		upkeep: 0.15,
		leadMonths: 2,
		landUses: ['factory'],
		labOnly: false
	},
	ipal_communal: {
		scope: 'tile',
		buildCost: 6.0,
		upkeep: 0.1,
		leadMonths: 3,
		landUses: ['settlement', 'dense_settlement'],
		labOnly: false
	},
	waste_bank: {
		scope: 'tile',
		buildCost: 0.5,
		upkeep: 0.05,
		leadMonths: 1,
		landUses: ['settlement', 'dense_settlement'],
		labOnly: false
	},
	biopori: {
		scope: 'tile',
		buildCost: 1.0,
		upkeep: 0.01,
		leadMonths: 0,
		landUses: ['settlement', 'dense_settlement', 'factory'],
		labOnly: false
	},
	eco_farming: {
		scope: 'tile',
		buildCost: 0.8,
		upkeep: 0.05,
		leadMonths: 6,
		landUses: ['paddy'],
		labOnly: false
	},
	greenbelt: {
		scope: 'segment',
		buildCost: 1.5,
		upkeep: 0.02,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	retention_pond: {
		scope: 'segment',
		buildCost: 7.0,
		upkeep: 0.05,
		leadMonths: 4,
		landUses: anyLandUse,
		labOnly: false
	},
	dredging: {
		scope: 'segment',
		buildCost: 5.0,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	river_cleanup: {
		scope: 'segment',
		buildCost: 0.2,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	clear_hyacinth: {
		scope: 'segment',
		buildCost: 0.5,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	enforcement: {
		scope: 'river',
		buildCost: 1.0,
		upkeep: 0.1,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	relocation: {
		scope: 'tile',
		buildCost: 10.0,
		upkeep: 0,
		leadMonths: 6,
		landUses: ['factory'],
		labOnly: false
	},
	change_land_use: {
		scope: 'tile',
		buildCost: 0,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: true
	},
	dismantle: {
		scope: 'tile',
		buildCost: 0,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	},
	floodgate: {
		scope: 'segment',
		buildCost: 9.0,
		upkeep: 0.2,
		leadMonths: 6,
		landUses: anyLandUse,
		labOnly: false
	},
	seal_illegal_outlet: {
		scope: 'segment',
		buildCost: 0.3,
		upkeep: 0,
		leadMonths: 0,
		landUses: anyLandUse,
		labOnly: false
	}
};

export const IPAL_COMMUNAL_DENSE_COST = 12.0;
export const IPAL_COMMUNAL_DENSE_UPKEEP = 0.2;
export const floodgateSegments: readonly SegmentIndex[] = [5, 6];
export const BIOPORI_RUNOFF_REDUCTION = 0.15;
export const SEAL_OUTLET_REDUCTION = 0.7;
export const RELOCATION_RESULT: LandUse = 'open_land';

export const interventionReductions: Partial<Record<InterventionType, Partial<LoadVector>>> = {
	ipal_industrial: {
		bod: 0.85,
		tss: 0.8,
		fecalColiform: 0.9,
		chromium: 0.9,
		nitrate: 0.3,
		phosphate: 0.4
	},
	ipal_communal: { bod: 0.8, tss: 0.7, fecalColiform: 0.95, nitrate: 0.3, phosphate: 0.5 },
	eco_farming: { nitrate: 0.4, phosphate: 0.4, tss: 0.2 },
	greenbelt: { tss: 0.3, nitrate: 0.2, phosphate: 0.2 }
};

export const EVENT_COOLDOWN_MONTHS = 6;
export const EXTREME_RAIN_CHANCE = 0.06;
export const DROUGHT_CHANCE = 0.08;
export const droughtMonths: readonly number[] = [6, 7, 8, 9];
export const DROUGHT_MIN_DURATION = 3;
export const DROUGHT_MAX_DURATION = 4;
export const DROUGHT_COOLDOWN_MONTHS = 24;
export const ILLEGAL_DUMPING_CHANCE_PER_FACTORY = 0.05;
export const ILLEGAL_DUMPING_ENFORCEMENT_FACTOR = 0.3;
export const ILLEGAL_DUMPING_BOD = 600;
export const ILLEGAL_DUMPING_CHROMIUM = 30;
export const LANDSLIDE_CHANCE = 0.15;
export const LANDSLIDE_TSS = 60000;
export const COMMUNITY_CHANCE = 0.1;
export const COMMUNITY_MIN_WASTE_BANKS = 2;
export const COMMUNITY_MAX_LITTER = 30;
export const ECOTOURISM_GOOD_MONTHS = 6;
export const ECOTOURISM_MAX_LITTER = 20;
export const randomNegativeEvents: readonly EventType[] = [
	'drought',
	'illegal_dumping',
	'landslide'
];

export const REVIEW_DAY = 15;
export const DAILY_STEPS = 96;
export const DAILY_WARMUP_DAYS = 3;
export const SOLAR_PEAK = 1000;
export const SUNRISE_HOUR = 6;
export const DAYLIGHT_HOURS = 12;
export const CLOUD_LIGHT_LOSS = 0.75;
export const WATER_TEMPERATURE_AMPLITUDE = 1.0;
export const WATER_TEMPERATURE_PEAK_OFFSET_HOUR = 9;
export const CLOUD_TEMPERATURE_LOSS = 0.5;
export const BIOMASS_MAX = 1.5;
export const BIOMASS_PHOSPHATE_UNIT = 0.5;
export const BIOMASS_TSS_CAP = 150;
export const BIOMASS_TSS_UNIT = 200;
export const BIOMASS_HYACINTH_SHARE = 0.5;
export const OXYGEN_PRODUCTION_BASE = 0.5;
export const OXYGEN_PRODUCTION_PER_BIOMASS = 30;
export const DAILY_DO_SATURATION_CAP = 1.5;
export const MOON_REFERENCE_JD = 2451550.26;
export const SYNODIC_MONTH_DAYS = 29.530588853;
export const MOONRISE_BASE_HOUR = 6;
export const TIDE_MEAN_AMPLITUDE = 0.5;
export const TIDE_SPRING_FACTOR = 0.4;
export const TIDE_HIGH_BASE_HOUR = 12;
export const TIDE_CHECK_HOUR = 15;
export const tideCapacityLoss: Partial<Record<SegmentIndex, number>> = { 5: 0.1, 6: 0.3 };
export const ROB_FLOOD_TIDE_THRESHOLD = 0.8;
export const FLOODGATE_TIDE_REDUCTION = 0.7;
export const FLOODGATE_ROB_LIMIT = 1.2;
export const MAX_SEA_LEVEL_RISE = 0.5;

export const SCORE_TARGET_WEIGHT = 60;
export const SCORE_INDICATOR_WEIGHT = 25;
export const SCORE_CASH_WEIGHT = 15;
export const MAX_STARS = 3;
export const INDICATOR_MAX = 100;
