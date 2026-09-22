import { describe, expect, it } from 'vitest';
import type { NotableChange } from '$lib/sim';
import { dialogEventOf } from './events';

describe('dialogEventOf', () => {
	it('memilih banjir di atas kejadian lain dan mengabaikan hujan lebat', () => {
		const changes: NotableChange[] = [
			{ kind: 'event', segment: null, before: '', after: 'heavy_rain' },
			{ kind: 'event', segment: 2, before: '', after: 'illegal_dumping' },
			{ kind: 'flood', segment: 4, before: '', after: '1.3' }
		];
		expect(dialogEventOf(changes, 6)).toEqual({ type: 'flood', segment: 4, month: 6 });
		expect(dialogEventOf(changes.slice(0, 2), 6)).toEqual({
			type: 'illegal_dumping',
			segment: 2,
			month: 6
		});
		expect(dialogEventOf(changes.slice(0, 1), 6)).toBeNull();
	});
});
