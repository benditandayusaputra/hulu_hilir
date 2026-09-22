import { describe, expect, it } from 'vitest';
import { fillSegments, layout, scenarioById, scenarios, tileOrder } from './scenarios';

describe('skenario', () => {
	it('mengurutkan 24 petak dari hulu ke muara', () => {
		expect(tileOrder).toHaveLength(24);
		expect(tileOrder[0]).toBe('S1-L1');
		expect(tileOrder[3]).toBe('S1-R2');
		expect(tileOrder[23]).toBe('S6-R2');
	});

	it('mengisi layout dengan nilai dasar, per segmen, dan per petak', () => {
		expect(layout('forest', { 'S2-L1': 'factory' })[4]).toBe('factory');
		const filled = fillSegments('forest', { 4: 'settlement' }, { 'S4-L1': 'factory' });
		expect(filled[12]).toBe('factory');
		expect(filled[13]).toBe('settlement');
		expect(filled[0]).toBe('forest');
	});

	it('menyediakan setiap skenario dengan 24 petak dan kejadian terjadwal yang sah', () => {
		for (const scenario of Object.values(scenarios)) {
			expect(scenario.tiles).toHaveLength(24);
			for (const event of scenario.scheduledEvents) expect(event.month).toBeGreaterThan(0);
		}
		expect(scenarioById('alami')?.mission).toBe(false);
		expect(scenarioById('rob-muara')?.seaLevelRise).toBeCloseTo(0.3);
		expect(scenarioById('rob-muara')?.scheduledEvents[0]?.day).toBeGreaterThan(0);
		expect(scenarioById('tidak-ada')).toBeNull();
	});
});
