import { describe, expect, it } from 'vitest';
import { narrationTriggers } from './schemas';
import { foreignNumbers } from './numbers';
import { samplePayload } from './samplePayload';
import { NARRATION_MAX_WORDS, narrateTemplate, TEMPLATE_VARIANTS } from './template';
import { countWords } from './text';

const details = {
	event: 'Ledakan eceng gondok',
	fish_extinct: 'sensitif',
	intervention_effect: 'Sabuk Hijau Bantaran'
} as const;

describe('narrateTemplate', () => {
	for (const trigger of narrationTriggers) {
		it(`mencakup pemicu ${trigger} dengan tiga variasi yang valid`, () => {
			const texts = new Set<string>();
			for (let variant = 0; variant < TEMPLATE_VARIANTS; variant += 1) {
				const detail = trigger in details ? details[trigger as keyof typeof details] : '';
				const payload = samplePayload({ trigger, month: 12 + variant, detail });
				const result = narrateTemplate(payload);
				expect(result.source).toBe('template');
				expect(result.text.length).toBeGreaterThan(20);
				expect(countWords(result.text)).toBeLessThanOrEqual(NARRATION_MAX_WORDS);
				expect(result.text).not.toContain('—');
				expect(foreignNumbers(result.text, payload)).toEqual([]);
				expect(result.suggestedAction).toBe('ipal_communal');
				expect(result.highlightSegments).toEqual([4]);
				texts.add(result.text);
			}
			expect(texts.size).toBe(TEMPLATE_VARIANTS);
		});
	}

	it('memilih fakta yang cocok dengan pemicu', () => {
		expect(narrateTemplate(samplePayload({ trigger: 'flood' })).factId).toBe('fact_forest_runoff');
		expect(narrateTemplate(samplePayload({ trigger: 'fish_kill' })).factId).toBe('fact_do_fish');
		expect(narrateTemplate(samplePayload()).factId).toBe('fact_coliform');
		expect(narrateTemplate(samplePayload({ trigger: 'yearly_summary' })).factId).toBeNull();
	});
});
