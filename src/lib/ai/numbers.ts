export const ROUNDING_TOLERANCE = 0.05;
const EPSILON = 1e-9;
const SMALL_INTEGER_MAX = 12;
const PERCENT = 100;

const numberPattern = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+,\d+|\d+\.\d{1,2}(?!\d)|\d+/g;

const units: Record<string, number> = {
	nol: 0,
	satu: 1,
	dua: 2,
	tiga: 3,
	empat: 4,
	lima: 5,
	enam: 6,
	tujuh: 7,
	delapan: 8,
	sembilan: 9
};

const specials: Record<string, number> = {
	sepuluh: 10,
	sebelas: 11,
	seratus: 100,
	seribu: 1000
};

const multipliers: Record<string, number> = { puluh: 10, ratus: 100, ribu: 1000 };
const TEEN_BASE = 10;

function parseDigits(token: string): number {
	if (/^\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(token)) {
		return Number(token.replaceAll('.', '').replace(',', '.'));
	}
	if (/^\d+,\d+$/.test(token)) return Number(token.replace(',', '.'));
	return Number(token);
}

export function extractDigitNumbers(text: string): number[] {
	return [...text.matchAll(numberPattern)].map((match) => parseDigits(match[0]));
}

function wordTokens(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z\s]/g, ' ')
		.split(/\s+/)
		.filter((token) => token !== '');
}

export function extractWordNumbers(text: string): number[] {
	const tokens = wordTokens(text);
	const found: number[] = [];
	let i = 0;
	while (i < tokens.length) {
		const token = tokens[i] ?? '';
		const unit = units[token];
		const special = specials[token];
		if (unit === undefined && special === undefined) {
			i += 1;
			continue;
		}
		let value = unit ?? special ?? 0;
		i += 1;
		let next = tokens[i] ?? '';
		if (unit !== undefined && next === 'belas') {
			value = TEEN_BASE + unit;
			i += 1;
		} else {
			while (unit !== undefined && multipliers[next] !== undefined) {
				value *= multipliers[next] ?? 1;
				i += 1;
				next = tokens[i] ?? '';
				const tail = units[next];
				if (tail !== undefined && multipliers[tokens[i + 1] ?? ''] === undefined) {
					if (tokens[i + 1] === 'belas') {
						value += TEEN_BASE + tail;
						i += 2;
					} else {
						value += tail;
						i += 1;
					}
					break;
				}
				if (tail !== undefined) {
					value += tail * (multipliers[tokens[i + 1] ?? ''] ?? 1);
					i += 2;
				}
				next = tokens[i] ?? '';
			}
		}
		found.push(value);
	}
	return found;
}

export function extractNumbers(text: string): number[] {
	return [...extractDigitNumbers(text), ...extractWordNumbers(text)];
}

function roundTo(value: number, digits: number): number {
	const factor = 10 ** digits;
	return Math.round(value * factor) / factor;
}

function collectNumbers(value: unknown, into: number[]): void {
	if (typeof value === 'number' && Number.isFinite(value)) {
		into.push(value);
		return;
	}
	if (Array.isArray(value)) {
		for (const item of value) collectNumbers(item, into);
		return;
	}
	if (typeof value === 'object' && value !== null) {
		for (const item of Object.values(value)) collectNumbers(item, into);
	}
}

export function allowedNumbers(payload: unknown): number[] {
	const raw: number[] = [];
	collectNumbers(payload, raw);
	const allowed = new Set<number>();
	for (const value of raw) {
		allowed.add(value);
		allowed.add(roundTo(value, 1));
		allowed.add(Math.abs(value));
		if (value >= 0 && value <= 1) {
			allowed.add(value * PERCENT);
			allowed.add(roundTo(value * PERCENT, 1));
			allowed.add(Math.round(value * PERCENT));
		}
	}
	for (let i = 0; i <= SMALL_INTEGER_MAX; i += 1) allowed.add(i);
	return [...allowed];
}

export function isAllowedNumber(value: number, allowed: readonly number[]): boolean {
	return allowed.some((candidate) => Math.abs(candidate - value) <= ROUNDING_TOLERANCE + EPSILON);
}

export function foreignNumbers(text: string, payload: unknown): number[] {
	const allowed = allowedNumbers(payload);
	return extractNumbers(text).filter((value) => !isAllowedNumber(value, allowed));
}
