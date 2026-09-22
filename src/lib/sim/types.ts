export const segmentIndices = [1, 2, 3, 4, 5, 6] as const;
export type SegmentIndex = (typeof segmentIndices)[number];

export const tileSides = ['L', 'R'] as const;
export type TileSide = (typeof tileSides)[number];
export const tilePositions = [1, 2] as const;
export type TilePosition = (typeof tilePositions)[number];
export type TileId = `S${SegmentIndex}-${TileSide}${TilePosition}`;

export const landUses = [
	'forest',
	'paddy',
	'settlement',
	'dense_settlement',
	'factory',
	'open_land'
] as const;
export type LandUse = (typeof landUses)[number];

export const tileInterventions = [
	'ipal_industrial',
	'ipal_communal',
	'waste_bank',
	'biopori',
	'eco_farming',
	'relocation'
] as const;
export const segmentInterventions = ['greenbelt', 'retention_pond', 'floodgate'] as const;
export const riverInterventions = ['enforcement'] as const;
export type TileIntervention = (typeof tileInterventions)[number];
export type SegmentIntervention = (typeof segmentInterventions)[number];
export type RiverIntervention = (typeof riverInterventions)[number];
export type InterventionType = TileIntervention | SegmentIntervention | RiverIntervention;

export const instantActions = [
	'plant_forest',
	'dredging',
	'river_cleanup',
	'clear_hyacinth',
	'change_land_use',
	'dismantle',
	'seal_illegal_outlet'
] as const;
export type InstantAction = (typeof instantActions)[number];
export const actionTypes = [
	...instantActions,
	...tileInterventions,
	...segmentInterventions,
	...riverInterventions
] as const;
export type ActionType = (typeof actionTypes)[number];
export type ActionScope = 'tile' | 'segment' | 'river';

export interface Action {
	month: number;
	type: ActionType;
	target: string;
	choice?: string;
}

export interface Intervention {
	type: InterventionType;
	activeFrom: number;
}

export interface TileState {
	id: TileId;
	segment: SegmentIndex;
	side: TileSide;
	position: TilePosition;
	landUse: LandUse;
	forestMaturity: number;
	interventions: readonly Intervention[];
}

export const loadParameters = [
	'bod',
	'tss',
	'nitrate',
	'phosphate',
	'fecalColiform',
	'chromium'
] as const;
export type LoadParameter = (typeof loadParameters)[number];
export type LoadVector = Record<LoadParameter, number>;

export const qualityParameters = ['do', ...loadParameters] as const;
export type QualityParameter = (typeof qualityParameters)[number];
export type Concentrations = Record<QualityParameter, number>;

export const waterStatuses = ['good', 'light', 'moderate', 'heavy'] as const;
export type WaterStatus = (typeof waterStatuses)[number];

export const floodStatuses = ['safe', 'alert', 'minor', 'major'] as const;
export type FloodStatus = (typeof floodStatuses)[number];

export const fishGroups = ['sensitive', 'intermediate', 'tolerant'] as const;
export type FishGroup = (typeof fishGroups)[number];
export type FishPopulation = Record<FishGroup, number>;

export interface SegmentState {
	index: SegmentIndex;
	flow: number;
	temperature: number;
	shade: number;
	concentrations: Concentrations;
	doSaturation: number;
	doDawn: number;
	doDayMax: number;
	pollutionIndex: number;
	status: WaterStatus;
	sediment: number;
	litter: number;
	hyacinth: number;
	greenbeltMaturity: number;
	interventions: readonly Intervention[];
	fish: FishPopulation;
	sensitiveLost: boolean;
	floodRatio: number;
	floodStatus: FloodStatus;
	goodStreak: number;
	ecotourism: boolean;
	settledTss: number;
}

export const eventTypes = [
	'heavy_rain',
	'extreme_rain',
	'drought',
	'illegal_dumping',
	'hyacinth_bloom',
	'landslide',
	'litter_shipment',
	'fish_kill',
	'fish_return',
	'community',
	'ecotourism',
	'flood',
	'rob_flood'
] as const;
export type EventType = (typeof eventTypes)[number];

export interface MonthEvent {
	type: EventType;
	month: number;
	segment: SegmentIndex | null;
	value: number;
}

export interface ScheduledEvent {
	month: number;
	type: EventType;
	segment?: SegmentIndex;
	day?: number;
}

export const changeKinds = [
	'status_change',
	'fish_extinct',
	'fish_return',
	'flood',
	'fish_kill',
	'event'
] as const;
export type ChangeKind = (typeof changeKinds)[number];

export interface NotableChange {
	kind: ChangeKind;
	segment: SegmentIndex | null;
	before: string;
	after: string;
}

export interface Indicators {
	waterQuality: number;
	fish: number;
	floodRisk: number;
	economy: number;
}

export interface EconomyState {
	revenue: number;
	jobs: number;
}

export interface CalendarDate {
	year: number;
	month: number;
	day: number;
}

export interface Budget {
	initial: number;
	monthly: number;
}

export interface SegmentOverrides {
	sediment?: number;
	litter?: number;
	hyacinth?: number;
	fish?: Partial<FishPopulation>;
}

export interface Scenario {
	id: string;
	startDate: CalendarDate;
	tiles: readonly LandUse[];
	budget: Budget | null;
	seaLevelRise: number;
	scheduledEvents: readonly ScheduledEvent[];
	segmentOverrides: Partial<Record<SegmentIndex, SegmentOverrides>>;
	mission: boolean;
}

export interface SimState {
	scenario: Scenario;
	month: number;
	rngState: number;
	tiles: readonly TileState[];
	segments: readonly SegmentState[];
	riverInterventions: readonly Intervention[];
	cash: number | null;
	cashReceived: number;
	upkeepPaid: boolean;
	economy: EconomyState;
	baseline: EconomyState;
	indicators: Indicators;
	droughtMonthsLeft: number;
	droughtActive: boolean;
	lastEventMonth: Partial<Record<EventType, number>>;
	litterToSea: number;
	litterToSeaTotal: number;
	affectedResidents: number;
	losses: number;
	events: readonly MonthEvent[];
	changes: readonly NotableChange[];
	actions: readonly Action[];
}

export interface StepResult {
	state: SimState;
	events: readonly MonthEvent[];
	changes: readonly NotableChange[];
}

export interface SimHistory {
	scenario: Scenario;
	seed: number;
	actions: readonly Action[];
	snapshots: readonly SimState[];
}

export type StarLevel = 1 | 2 | 3;

export interface MissionTarget {
	id: string;
	star: StarLevel;
	check: (history: SimHistory) => boolean;
}

export interface MissionDefinition {
	id: string;
	months: number;
	targets: readonly MissionTarget[];
}

export interface TargetResult {
	id: string;
	star: StarLevel;
	met: boolean;
}

export interface MissionResult {
	score: number;
	stars: number;
	targets: readonly TargetResult[];
	indicators: Indicators;
	cashEfficiency: number;
}

export interface DecisionImpact {
	action: Action;
	scoreDelta: number;
	indicatorDeltas: Indicators;
}

export type CauseSource =
	LandUse | 'treated_factory' | 'treated_settlement' | EventType | 'background';

export interface CauseShare {
	source: CauseSource;
	segment: SegmentIndex | null;
	share: number;
}

export type CauseReport = Record<LoadParameter, readonly CauseShare[]>;

export const actionErrorCodes = [
	'unknown_action',
	'invalid_target',
	'incompatible_land_use',
	'already_installed',
	'insufficient_cash',
	'lab_only',
	'nothing_to_dismantle'
] as const;
export type ActionErrorCode = (typeof actionErrorCodes)[number];

export interface ActionError {
	code: ActionErrorCode;
	action: Action;
}

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
