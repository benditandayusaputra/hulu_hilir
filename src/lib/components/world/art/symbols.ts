import type { WaterStatus } from '$lib/sim';

export interface WorldSymbol {
	id: string;
	width: number;
	height: number;
}

export const worldStroke = { large: 3, small: 2 } as const;

export const worldPalette = {
	outline: '#3B2A22',
	grassLight: '#8CC152',
	grassMid: '#6BA845',
	grassDark: '#5E9B3E',
	grassShadow: '#4A7F32',
	soil: '#C9A46B',
	soilWet: '#A8834F',
	sand: '#EAD9A6',
	sandWet: '#D6BF86',
	stone: '#9AA3A8',
	stoneLight: '#BCC3C7',
	stoneDark: '#7B858B',
	wood: '#A8733F',
	woodDark: '#7E5430',
	roof: '#C8553D',
	roofLight: '#DB6F55',
	roofDark: '#A1402D',
	plaster: '#F6EBD2',
	plasterShade: '#DCC7A0',
	waterLight: '#5CC4E6',
	waterMid: '#45A9D6',
	waterDeep: '#2E8BC0',
	glint: '#BFEFFF',
	glass: '#BFEFFF',
	glassShade: '#8FC4D6',
	smoke: '#F2F2EE',
	smokeShade: '#CDD3D6',
	smokeLight: '#FFFFFF',
	effluent: '#7A6546',
	foam: '#F7F5EC',
	murk: '#5A4830'
} as const;

export const outlineLarge = {
	stroke: worldPalette.outline,
	'stroke-width': worldStroke.large,
	'stroke-linejoin': 'round',
	'stroke-linecap': 'round'
} as const;

export const outlineSmall = { ...outlineLarge, 'stroke-width': worldStroke.small } as const;

export const forestMature: WorldSymbol = { id: 'world-forest-mature', width: 220, height: 200 };

export const house: WorldSymbol = { id: 'world-house', width: 120, height: 124 };

export const factory: WorldSymbol = { id: 'world-factory', width: 230, height: 212 };

export const riverPieces: Record<WaterStatus, WorldSymbol> = {
	good: { id: 'world-river-good', width: 260, height: 170 },
	light: { id: 'world-river-light', width: 260, height: 170 },
	moderate: { id: 'world-river-moderate', width: 260, height: 170 },
	heavy: { id: 'world-river-heavy', width: 260, height: 170 }
};

export const waterItems = {
	fishShadow: 'world-fish-shadow',
	foam: 'world-foam',
	scum: 'world-scum',
	bottle: 'world-bottle',
	bag: 'world-bag',
	can: 'world-can',
	deadFish: 'world-dead-fish',
	sludge: 'world-sludge'
} as const;

export interface Circle {
	x: number;
	y: number;
	r: number;
	lit?: boolean;
}

export interface WaterTone {
	deep: string;
	mid: string;
	shallow: string;
	rim: string;
	ripple: string;
}

export const waterTones: Record<WaterStatus, WaterTone> = {
	good: {
		deep: worldPalette.waterDeep,
		mid: worldPalette.waterMid,
		shallow: worldPalette.waterLight,
		rim: worldPalette.glint,
		ripple: worldPalette.glint
	},
	light: { deep: '#3F8F86', mid: '#5AA99A', shallow: '#7CC0AE', rim: '#D4EFE6', ripple: '#D4EFE6' },
	moderate: {
		deep: '#6E5A3A',
		mid: '#87714A',
		shallow: '#A48B5C',
		rim: '#C9B68E',
		ripple: '#C9B68E'
	},
	heavy: { deep: '#211A15', mid: '#2C241D', shallow: '#3D332A', rim: '#A39A7C', ripple: '#6D6450' }
};

export function tuftPath(x: number, y: number): string {
	return `M${x} ${y} c-1 -3 -3 -5 -5 -6 c3 0 5 2 6 4 c0 -3 1 -6 3 -8 c0 3 0 6 -1 9 c1 -2 3 -3 5 -3 c-2 1 -3 2 -4 4 Z`;
}
