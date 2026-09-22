import {
	actionSpecs,
	applyAction,
	buildCostOf,
	calendarDateOfMonth,
	createInitialState,
	eventTypes,
	fishGroups,
	fishScore,
	floodStatusOf,
	landUses,
	riverInterventions,
	RIVER_TARGET,
	seasonOf,
	segmentInterventions,
	stepMonth,
	tileInterventions,
	waterStatuses,
	type Action,
	type ActionScope,
	type ActionType,
	type CalendarDate,
	type EventType,
	type FishGroup,
	type InterventionType,
	type LandUse,
	type NotableChange,
	type Scenario,
	type Season,
	type SegmentIndex,
	type SegmentState,
	type SimState,
	type StepResult,
	type TileId,
	type TileState,
	type WaterStatus
} from '$lib/sim';
import {
	actionErrorMessage,
	actionEffects,
	actionInstalledMessage,
	actionNames,
	actionRemovedMessage,
	actionUndoneMessage,
	eventMessage,
	fishExtinctMessage,
	fishReturnMessage,
	floodMessage,
	floodgateTargetMessage,
	landUseEffects,
	landUseNames,
	monthMessage,
	rewoundMessage,
	statusChangedMessage,
	waterCellName,
	type TileSideKey
} from '$lib/content/lab';
import { announcer } from './announcer.svelte';
import { settings } from './settings.svelte';
import { toaster, type ToastTone } from './toast.svelte';

export const speedOptions = [1, 2, 4] as const;
export type Speed = (typeof speedOptions)[number];
export const MONTH_INTERVAL_MS = 1500;
export const DEFAULT_SEED = 2026;
export const sessionKey = Symbol('simulation-session');

export interface Tool {
	type: ActionType;
	choice?: LandUse;
}

export type ToolGroupId = 'land' | 'tile' | 'segment' | 'river';

export interface ToolGroup {
	id: ToolGroupId;
	tools: readonly Tool[];
}

const segmentActions: readonly ActionType[] = [
	...segmentInterventions,
	'dredging',
	'river_cleanup',
	'clear_hyacinth',
	'seal_illegal_outlet'
];

const tileActions: readonly ActionType[] = ['plant_forest', ...tileInterventions];

export const toolGroups: readonly ToolGroup[] = [
	{ id: 'land', tools: landUses.map((choice): Tool => ({ type: 'change_land_use', choice })) },
	{ id: 'tile', tools: tileActions.map((type): Tool => ({ type })) },
	{ id: 'segment', tools: segmentActions.map((type): Tool => ({ type })) },
	{ id: 'river', tools: riverInterventions.map((type): Tool => ({ type })) }
];

export function toolId(tool: Tool): string {
	return tool.choice === undefined ? tool.type : `${tool.type}:${tool.choice}`;
}

export function toolName(tool: Tool): string {
	return tool.choice === undefined ? actionNames[tool.type] : landUseNames[tool.choice];
}

export function toolEffect(tool: Tool): string {
	return tool.choice === undefined ? actionEffects[tool.type] : landUseEffects[tool.choice];
}

export function toolScope(tool: Tool): ActionScope {
	return actionSpecs[tool.type].scope;
}

export function toolLeadMonths(tool: Tool): number {
	return actionSpecs[tool.type].leadMonths;
}

export function toolUpkeep(tool: Tool): number {
	return actionSpecs[tool.type].upkeep;
}

export function actionLabel(action: Action): string {
	if (action.type === 'change_land_use') {
		const choice = landUses.find((use) => use === action.choice);
		return choice === undefined ? actionNames[action.type] : landUseNames[choice];
	}
	if (action.type === 'dismantle') {
		const target = interventionOf(action.choice);
		return target === null ? actionNames[action.type] : actionNames[target];
	}
	return actionNames[action.type];
}

export type CellColumn = 0 | 1 | 2 | 3 | 4;
export const cellColumns: readonly CellColumn[] = [0, 1, 2, 3, 4];
export const WATER_COLUMN: CellColumn = 2;

export const columnSides: Record<CellColumn, TileSideKey | null> = {
	0: 'L2',
	1: 'L1',
	2: null,
	3: 'R1',
	4: 'R2'
};

export interface CellRef {
	segment: SegmentIndex;
	column: CellColumn;
}

export function cellTileId(cell: CellRef): TileId | null {
	const side = columnSides[cell.column];
	return side === null ? null : `S${cell.segment}-${side}`;
}

export function sameCell(left: CellRef | null, right: CellRef | null): boolean {
	if (left === null || right === null) return left === right;
	return left.segment === right.segment && left.column === right.column;
}

export interface ActionPreview {
	action: Action;
	ok: boolean;
	reason: string;
	cost: number;
	cashAfter: number | null;
}

export interface SessionCalendar {
	date: CalendarDate;
	yearNumber: number;
	season: Season;
}

interface ChangeMessage {
	text: string;
	tone: ToastTone;
}

function interventionOf(value: string | undefined): InterventionType | null {
	const all: readonly InterventionType[] = [
		...tileInterventions,
		...segmentInterventions,
		...riverInterventions
	];
	return all.find((type) => type === value) ?? null;
}

function isWaterStatus(value: string): value is WaterStatus {
	return waterStatuses.some((status) => status === value);
}

function isEventType(value: string): value is EventType {
	return eventTypes.some((type) => type === value);
}

function isFishGroup(value: string): value is FishGroup {
	return fishGroups.some((group) => group === value);
}

function firstOf(items: readonly SimState[]): SimState {
	const first = items[0];
	if (first === undefined) throw new Error('session has no snapshots');
	return first;
}

function lastOf(items: readonly SimState[]): SimState {
	const last = items[items.length - 1];
	if (last === undefined) throw new Error('session has no snapshots');
	return last;
}

function applyPending(state: SimState, pending: readonly Action[]): SimState {
	let working = state;
	for (const action of pending) {
		const result = applyAction(working, action);
		if (result.ok) working = result.value;
	}
	return working;
}

function calendarOf(start: CalendarDate, month: number): SessionCalendar {
	const date = month === 0 ? start : calendarDateOfMonth(start, month);
	return { date, yearNumber: date.year - start.year + 1, season: seasonOf(date.month) };
}

function changeMessage(change: NotableChange): ChangeMessage | null {
	const segment = change.segment;
	if (change.kind === 'status_change' && segment !== null && isWaterStatus(change.after)) {
		return { text: statusChangedMessage(segment, change.after), tone: 'info' };
	}
	if (change.kind === 'event' && isEventType(change.after)) {
		return { text: eventMessage(change.after, segment), tone: 'info' };
	}
	if (change.kind === 'flood') {
		return { text: floodMessage(segment, floodStatusOf(Number(change.after))), tone: 'danger' };
	}
	if (change.kind === 'fish_kill' && segment !== null) {
		return { text: eventMessage('fish_kill', segment), tone: 'danger' };
	}
	if (change.kind === 'fish_return' && segment !== null) {
		return { text: fishReturnMessage(segment), tone: 'success' };
	}
	if (change.kind === 'fish_extinct' && segment !== null && isFishGroup(change.before)) {
		return { text: fishExtinctMessage(segment, change.before), tone: 'danger' };
	}
	return null;
}

export class SimulationSession {
	seed = $state(DEFAULT_SEED);
	snapshots = $state.raw<readonly SimState[]>([]);
	log = $state.raw<readonly Action[]>([]);
	pending = $state.raw<readonly Action[]>([]);
	selectedTool = $state.raw<Tool | null>(null);
	selection = $state.raw<CellRef | null>(null);
	focusedSegment = $state<SegmentIndex>(1);
	playing = $state(false);
	speed = $state<Speed>(1);
	private timer: ReturnType<typeof setInterval> | null = null;

	state = $derived(applyPending(this.latest, this.pending));
	calendar = $derived(calendarOf(this.scenario.startDate, this.month));
	indicatorHistory = $derived(this.snapshots.map((snapshot) => snapshot.indicators));
	enforcementActive = $derived(
		this.state.riverInterventions.some((item) => item.type === 'enforcement')
	);

	constructor(scenario: Scenario, seed = DEFAULT_SEED) {
		this.seed = seed;
		this.snapshots = [createInitialState(scenario, seed)];
	}

	get initial(): SimState {
		return firstOf(this.snapshots);
	}

	get latest(): SimState {
		return lastOf(this.snapshots);
	}

	get previous(): SimState | null {
		return this.snapshots[this.snapshots.length - 2] ?? null;
	}

	get scenario(): Scenario {
		return this.initial.scenario;
	}

	get month(): number {
		return this.latest.month;
	}

	reset(scenario: Scenario, seed = this.seed): void {
		this.pause();
		this.seed = seed;
		this.snapshots = [createInitialState(scenario, seed)];
		this.log = [];
		this.pending = [];
		this.selection = null;
		this.selectedTool = null;
		this.focusedSegment = 1;
	}

	tileAt(cell: CellRef): TileState | null {
		const id = cellTileId(cell);
		if (id === null) return null;
		return this.state.tiles.find((tile) => tile.id === id) ?? null;
	}

	segmentAt(index: SegmentIndex): SegmentState {
		const segment = this.state.segments[index - 1];
		if (segment === undefined) throw new Error('segment index out of range');
		return segment;
	}

	waterCellNameOf(index: SegmentIndex): string {
		const segment = this.segmentAt(index);
		return waterCellName(
			index,
			segment.status,
			segment.pollutionIndex,
			fishScore(segment.fish),
			segment.floodStatus
		);
	}

	actionFor(tool: Tool, cell: CellRef): Action | null {
		const month = this.month + 1;
		const scope = toolScope(tool);
		if (scope === 'river') return { month, type: tool.type, target: RIVER_TARGET };
		if (scope === 'segment') return { month, type: tool.type, target: String(cell.segment) };
		const target = cellTileId(cell);
		if (target === null) return null;
		if (tool.choice === undefined) return { month, type: tool.type, target };
		return { month, type: tool.type, target, choice: tool.choice };
	}

	previewTool(tool: Tool, cell: CellRef): ActionPreview {
		const action = this.actionFor(tool, cell);
		const tile = this.tileAt(cell);
		const landUse = tile === null ? null : tile.landUse;
		const cost = buildCostOf(tool.type, landUse);
		const name = toolName(tool);
		if (action === null) {
			const reason = actionErrorMessage('invalid_target', name, '');
			return {
				action: this.emptyAction(tool),
				ok: false,
				reason,
				cost,
				cashAfter: this.state.cash
			};
		}
		return this.preview(action, name, cost);
	}

	previewDismantle(cell: CellRef, type: InterventionType): ActionPreview {
		const month = this.month + 1;
		const scope = actionSpecs[type].scope;
		const target =
			scope === 'river'
				? RIVER_TARGET
				: scope === 'segment'
					? String(cell.segment)
					: (cellTileId(cell) ?? String(cell.segment));
		const action: Action = { month, type: 'dismantle', target, choice: type };
		return this.preview(action, actionNames[type], 0);
	}

	install(tool: Tool, cell: CellRef): boolean {
		const preview = this.previewTool(tool, cell);
		if (!preview.ok) {
			toaster.show(preview.reason, 'danger');
			return false;
		}
		this.pending = [...this.pending, preview.action];
		toaster.show(actionInstalledMessage(toolName(tool), cell.segment, this.state.cash), 'success');
		return true;
	}

	removeIntervention(cell: CellRef, type: InterventionType): boolean {
		const preview = this.previewDismantle(cell, type);
		if (!preview.ok) {
			toaster.show(preview.reason, 'danger');
			return false;
		}
		this.pending = [...this.pending, preview.action];
		toaster.show(actionRemovedMessage(actionNames[type], cell.segment), 'success');
		return true;
	}

	undo(): boolean {
		const last = this.pending[this.pending.length - 1];
		if (last === undefined) return false;
		this.pending = this.pending.slice(0, -1);
		toaster.show(actionUndoneMessage(actionLabel(last)), 'info');
		return true;
	}

	rewindTo(month: number): void {
		const target = Math.floor(month);
		if (target < 0 || target >= this.month) return;
		this.pause();
		this.snapshots = this.snapshots.slice(0, target + 1);
		this.log = this.log.filter((action) => action.month <= target);
		this.pending = [];
		toaster.show(rewoundMessage(target), 'info');
	}

	step(): StepResult {
		const result = stepMonth(this.latest, this.pending);
		this.snapshots = [...this.snapshots, result.state];
		this.log = [...this.log, ...result.state.actions];
		this.pending = [];
		this.announceStep(result);
		return result;
	}

	play(): void {
		if (this.playing) return;
		this.playing = true;
		this.timer = setInterval(() => this.step(), MONTH_INTERVAL_MS / this.speed);
	}

	pause(): void {
		if (this.timer !== null) clearInterval(this.timer);
		this.timer = null;
		this.playing = false;
	}

	togglePlay(): void {
		if (this.playing) this.pause();
		else this.play();
	}

	setSpeed(speed: Speed): void {
		this.speed = speed;
		if (!this.playing) return;
		this.pause();
		this.play();
	}

	dispose(): void {
		this.pause();
	}

	private emptyAction(tool: Tool): Action {
		return { month: this.month + 1, type: tool.type, target: '' };
	}

	private preview(action: Action, name: string, cost: number): ActionPreview {
		const result = applyAction(this.state, action);
		if (result.ok) {
			return { action, ok: true, reason: '', cost, cashAfter: result.value.cash };
		}
		const tile = this.state.tiles.find((item) => item.id === action.target);
		const landUse = tile === undefined ? '' : landUseNames[tile.landUse];
		const reason =
			action.type === 'floodgate' && result.error.code === 'invalid_target'
				? floodgateTargetMessage
				: actionErrorMessage(result.error.code, name, landUse);
		return { action, ok: false, reason, cost, cashAfter: this.state.cash };
	}

	private announceStep(result: StepResult): void {
		const frequency = settings.narrationFrequency;
		const previous = this.previous;
		if (frequency === 'normal' && this.speed === 1 && previous !== null) {
			const quality = result.state.indicators.waterQuality;
			announcer.announce(
				monthMessage(
					this.calendar.date.month,
					this.calendar.yearNumber,
					quality,
					quality - previous.indicators.waterQuality
				)
			);
		}
		const announceImportant = frequency !== 'off';
		const announceAll = announceImportant && this.speed === 1;
		for (const change of result.changes) {
			const message = changeMessage(change);
			if (message === null) continue;
			const important = change.kind === 'status_change';
			toaster.show(message.text, message.tone, important ? announceImportant : announceAll);
		}
	}
}
