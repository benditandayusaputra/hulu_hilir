import type { FishGroup, WaterStatus } from '$lib/sim';

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

function symbol(id: string, width: number, height: number): WorldSymbol {
	return { id: `world-${id}`, width, height };
}

export const plot = symbol('plot', 240, 150);

export const forestStages = [
	symbol('forest-seedling', 200, 120),
	symbol('forest-young', 200, 150),
	symbol('forest-teen', 210, 180),
	symbol('forest-mature', 220, 200)
] as const;

export const paddyStages = {
	planted: symbol('paddy-planted', 240, 160),
	harvest: symbol('paddy-harvest', 240, 160)
} as const;

export const houseVariants = {
	cream: symbol('house', 120, 124),
	mint: symbol('house-mint', 120, 124),
	peach: symbol('house-peach', 120, 124)
} as const;

export const settlement = symbol('settlement', 250, 230);
export const denseSettlement = symbol('dense-settlement', 230, 220);
export const factory = symbol('factory', 230, 212);
export const openLand = symbol('open-land', 220, 140);
export const ipal = symbol('ipal', 230, 190);
export const wasteBank = symbol('waste-bank', 210, 170);
export const retentionPond = symbol('retention-pond', 230, 160);
export const greenbelt = symbol('greenbelt', 280, 140);
export const floodgate = symbol('floodgate', 250, 200);

export const fishSymbols: Record<FishGroup, WorldSymbol> = {
	sensitive: symbol('fish-sensitive', 40, 20),
	intermediate: symbol('fish-intermediate', 40, 24),
	tolerant: symbol('fish-tolerant', 44, 22)
};

export const boat = symbol('boat', 110, 60);
export const hyacinth = symbol('hyacinth', 64, 48);
export const birdEgret = symbol('bird-egret', 40, 50);
export const birdFlying = symbol('bird-flying', 44, 24);
export const signboard = symbol('signboard', 130, 96);

export const mountains = symbol('mountains', 520, 260);
export const hills = symbol('hills', 460, 190);
export const city = symbol('city', 480, 230);
export const beach = symbol('beach', 420, 170);
export const sea = symbol('sea', 480, 170);

export const props = {
	ipal: symbol('prop-ipal', 64, 56),
	bins: symbol('prop-bins', 70, 42),
	biopori: symbol('prop-biopori', 64, 30),
	eco: symbol('prop-eco', 40, 56),
	relocation: symbol('prop-relocation', 64, 44),
	shrub: symbol('prop-shrub', 46, 34),
	sapling: symbol('prop-sapling', 36, 58),
	palm: symbol('prop-palm', 90, 120)
} as const;

export const riverPieces: Record<WaterStatus, WorldSymbol> = {
	good: symbol('river-good', 260, 170),
	light: symbol('river-light', 260, 170),
	moderate: symbol('river-moderate', 260, 170),
	heavy: symbol('river-heavy', 260, 170)
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

export interface Trunk {
	x: number;
	top: number;
	bottom: number;
	width: number;
}

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

export const depth = { x: 0.6, y: -0.38 } as const;

export interface PrismFaces {
	front: string;
	side: string;
	top: string;
}

export function prismFaces(
	x: number,
	base: number,
	width: number,
	height: number,
	deep: number
): PrismFaces {
	const dx = deep * depth.x;
	const dy = deep * depth.y;
	const top = base - height;
	const right = x + width;
	return {
		front: `M${x} ${base} L${right} ${base} L${right} ${top} L${x} ${top} Z`,
		side: `M${right} ${base} L${right + dx} ${base + dy} L${right + dx} ${top + dy} L${right} ${top} Z`,
		top: `M${x} ${top} L${right} ${top} L${right + dx} ${top + dy} L${x + dx} ${top + dy} Z`
	};
}

export const ellipseRatio = 0.38;
