import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseHex, type Rgb } from './contrast';
import { contrastPairIds, contrastPairs } from './pairs';

const css = readFileSync(new URL('../../app.css', import.meta.url), 'utf8');
const themes = ['light', 'dark'] as const;

function token(name: string): Record<(typeof themes)[number], Rgb> {
	const match = new RegExp(`${name}:\\s*([^;]+);`).exec(css);
	const value = match?.[1]?.trim() ?? '';
	const pair = /^light-dark\((#[\da-f]{6}),\s*(#[\da-f]{6})\)$/i.exec(value);
	const light = parseHex(pair?.[1] ?? value);
	const dark = parseHex(pair?.[2] ?? value);
	if (light === null || dark === null) throw new Error(`token ${name} tidak terbaca: ${value}`);
	return { light, dark };
}

describe('kontras token teks dan latar', () => {
	it('setiap pasangan terdaftar tepat sekali', () => {
		expect(contrastPairs.map((pair) => pair.id)).toEqual([...contrastPairIds]);
	});

	for (const pair of contrastPairs) {
		for (const theme of themes) {
			it(`${pair.id} di tema ${theme} minimal ${pair.target}:1`, () => {
				const ratio = contrastRatio(token(pair.fg)[theme], token(pair.bg)[theme]);
				expect(ratio).toBeGreaterThanOrEqual(pair.target);
			});
		}
	}
});
