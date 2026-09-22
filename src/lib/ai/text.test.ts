import { describe, expect, it } from 'vitest';
import { countWords, limitWords, normalizeWhitespace, replaceEmDash, stripCodeFence } from './text';

describe('text', () => {
	it('mengganti em dash dengan koma', () => {
		expect(replaceEmDash('Air keruh — ikan pergi')).toBe('Air keruh, ikan pergi');
	});

	it('memotong di batas kalimat saat melewati batas kata', () => {
		expect(limitWords('Satu dua. Tiga empat lima. Enam tujuh delapan.', 6)).toBe(
			'Satu dua. Tiga empat lima.'
		);
		expect(limitWords('Satu dua tiga empat lima enam', 3)).toBe('Satu dua tiga.');
		expect(limitWords('Satu dua.', 10)).toBe('Satu dua.');
	});

	it('membuka pagar kode dan merapikan spasi', () => {
		expect(stripCodeFence('```json\n{"a":1}\n```')).toBe('{"a":1}');
		expect(stripCodeFence('{"a":1}')).toBe('{"a":1}');
		expect(normalizeWhitespace('  a \n b  ')).toBe('a b');
		expect(countWords(' satu  dua tiga ')).toBe(3);
	});
});
