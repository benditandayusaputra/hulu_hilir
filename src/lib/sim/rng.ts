const MULBERRY_INCREMENT = 0x6d2b79f5;
const MULBERRY_SHIFT_A = 15;
const MULBERRY_SHIFT_B = 7;
const MULBERRY_SHIFT_C = 14;
const MULBERRY_MIX_A = 61;
const TWO_POW_32 = 4294967296;

export interface RngDraw {
	value: number;
	state: number;
}

export function seedState(seed: number): number {
	return seed | 0;
}

export function nextFloat(state: number): RngDraw {
	const advanced = (state + MULBERRY_INCREMENT) | 0;
	let t = Math.imul(advanced ^ (advanced >>> MULBERRY_SHIFT_A), 1 | advanced);
	t = (t + Math.imul(t ^ (t >>> MULBERRY_SHIFT_B), MULBERRY_MIX_A | t)) ^ t;
	return { value: ((t ^ (t >>> MULBERRY_SHIFT_C)) >>> 0) / TWO_POW_32, state: advanced };
}

export class RngStream {
	state: number;

	constructor(state: number) {
		this.state = state;
	}

	float(): number {
		const draw = nextFloat(this.state);
		this.state = draw.state;
		return draw.value;
	}

	chance(probability: number): boolean {
		return this.float() < probability;
	}

	range(min: number, max: number): number {
		return min + (max - min) * this.float();
	}

	pickIndex(length: number): number {
		return Math.min(length - 1, Math.floor(this.float() * length));
	}
}
