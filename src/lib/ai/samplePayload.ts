import type { NarrationPayload } from './schemas';

export function samplePayload(overrides: Partial<NarrationPayload> = {}): NarrationPayload {
	return {
		kind: 'change',
		audience: 'smp',
		month: 19,
		calendarMonth: 'Juli',
		season: 'Kemarau',
		trigger: 'status_change',
		detail: '',
		segments: [
			{
				id: 4,
				name: 'Kota',
				statusBefore: 'Cemar ringan',
				statusAfter: 'Cemar sedang',
				ip: 5.8,
				ipBefore: 3.2,
				do: 3.1,
				bod: 6.4,
				fecalColiform: 9200,
				fish: 35
			}
		],
		causes: [
			{ type: 'load', source: 'Permukiman padat', segment: 4, shareOfBod: 0.72 },
			{ type: 'season', flowFactor: 0.55 }
		],
		indicators: { waterQuality: 58, fish: 41, floodRisk: 22, economy: 63 },
		availableActions: ['ipal_communal', 'waste_bank', 'greenbelt'],
		...overrides
	};
}
