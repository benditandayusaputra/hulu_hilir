import { actionNames, seasonNames } from '$lib/content/lab';
import {
	causeSentences,
	eventNamesForFacts,
	meaningSentences,
	seasonSentences,
	suggestionSentences,
	triggerSentences,
	type TemplateContext
} from '$lib/content/narration';
import { formatNumber, formatScore } from '$lib/format/number';
import { classTwoStandard, type Season } from '$lib/sim';
import type { NarrationPayload, NarrationResult } from './schemas';
import { limitWords } from './text';

export const TEMPLATE_VARIANTS = 3;
export const NARRATION_MAX_WORDS = 90;
const PERCENT = 100;

function seasonKeyOf(name: string): Season {
	const entry = Object.entries(seasonNames).find(([, label]) => label === name);
	const key = entry?.[0];
	return key === 'wet' || key === 'dry' ? key : 'transition';
}

export function factFor(payload: NarrationPayload): string | null {
	const primary = payload.segments[0];
	switch (payload.trigger) {
		case 'flood':
			return 'fact_forest_runoff';
		case 'fish_kill':
		case 'fish_extinct':
		case 'fish_return':
			return 'fact_do_fish';
		case 'event':
			return eventNamesForFacts[payload.detail] ?? null;
		case 'intervention_effect':
			if (payload.detail === actionNames.greenbelt) return 'fact_greenbelt';
			if (
				payload.detail === actionNames.ipal_industrial ||
				payload.detail === actionNames.ipal_communal
			) {
				return 'fact_ipal';
			}
			return null;
		case 'status_change':
			if (primary !== undefined && primary.fecalColiform > classTwoStandard.fecalColiform) {
				return 'fact_coliform';
			}
			return 'fact_bod';
		case 'yearly_summary':
			return null;
	}
}

export function narrateTemplate(payload: NarrationPayload): NarrationResult {
	const variant = payload.month % TEMPLATE_VARIANTS;
	const primary = payload.segments[0];
	if (primary === undefined) throw new Error('payload has no segments');
	const context: TemplateContext = {
		segment: `Segmen ${primary.id} ${primary.name}`,
		statusBefore: primary.statusBefore,
		statusAfter: primary.statusAfter,
		ip: formatNumber(primary.ip, 1),
		ipBefore: formatNumber(primary.ipBefore, 1),
		oxygen: formatNumber(primary.do, 1),
		fish: formatScore(primary.fish),
		detail: payload.detail,
		waterQuality: formatScore(payload.indicators.waterQuality),
		fishIndicator: formatScore(payload.indicators.fish),
		floodRisk: formatScore(payload.indicators.floodRisk)
	};
	const pick = <T>(items: readonly T[]): T => {
		const item = items[variant] ?? items[0];
		if (item === undefined) throw new Error('template variants missing');
		return item;
	};
	const sentences = [pick(triggerSentences[payload.trigger])(context)];
	const load = payload.causes.find((cause) => cause.type === 'load');
	if (load !== undefined && load.type === 'load') {
		sentences.push(pick(causeSentences)(load.source, formatScore(load.shareOfBod * PERCENT)));
	}
	sentences.push(pick(meaningSentences)(primary.statusAfter));
	sentences.push(pick(seasonSentences[seasonKeyOf(payload.season)]));
	const action = payload.availableActions[0] ?? null;
	if (action !== null) sentences.push(pick(suggestionSentences)(actionNames[action]));
	return {
		text: limitWords(sentences.join(' '), NARRATION_MAX_WORDS),
		source: 'template',
		highlightSegments: payload.segments.map((segment) => segment.id),
		suggestedAction: action,
		factId: factFor(payload)
	};
}
