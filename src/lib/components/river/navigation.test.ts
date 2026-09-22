import { describe, expect, it } from 'vitest';
import { nextCell, type NavigationKey } from './navigation';

function key(name: string, ctrlKey = false): NavigationKey {
	return { key: name, ctrlKey, metaKey: false };
}

describe('nextCell', () => {
	it('memindahkan segmen dengan panah atas dan bawah lalu berhenti di ujung', () => {
		expect(nextCell({ segment: 3, column: 1 }, key('ArrowDown'))).toEqual({
			segment: 4,
			column: 1
		});
		expect(nextCell({ segment: 3, column: 1 }, key('ArrowUp'))).toEqual({ segment: 2, column: 1 });
		expect(nextCell({ segment: 1, column: 1 }, key('ArrowUp'))).toEqual({ segment: 1, column: 1 });
		expect(nextCell({ segment: 6, column: 1 }, key('ArrowDown'))).toEqual({
			segment: 6,
			column: 1
		});
	});

	it('memindahkan sel dengan panah kiri dan kanan dalam segmen yang sama', () => {
		expect(nextCell({ segment: 2, column: 1 }, key('ArrowRight'))).toEqual({
			segment: 2,
			column: 2
		});
		expect(nextCell({ segment: 2, column: 0 }, key('ArrowLeft'))).toEqual({
			segment: 2,
			column: 0
		});
		expect(nextCell({ segment: 2, column: 4 }, key('ArrowRight'))).toEqual({
			segment: 2,
			column: 4
		});
	});

	it('melompat ke sel pertama atau terakhir dengan Home dan End', () => {
		expect(nextCell({ segment: 5, column: 2 }, key('Home'))).toEqual({ segment: 5, column: 0 });
		expect(nextCell({ segment: 5, column: 2 }, key('End'))).toEqual({ segment: 5, column: 4 });
	});

	it('melompat ke segmen 1 atau 6 dengan Ctrl+Home dan Ctrl+End', () => {
		expect(nextCell({ segment: 4, column: 3 }, key('Home', true))).toEqual({
			segment: 1,
			column: 3
		});
		expect(nextCell({ segment: 4, column: 3 }, key('End', true))).toEqual({
			segment: 6,
			column: 3
		});
	});

	it('mengabaikan tombol lain', () => {
		expect(nextCell({ segment: 4, column: 3 }, key('Enter'))).toBeNull();
		expect(nextCell({ segment: 4, column: 3 }, key('a'))).toBeNull();
	});
});
