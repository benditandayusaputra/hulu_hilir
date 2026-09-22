import * as v from 'valibot';
import { actionTypes } from '$lib/sim';
import { narrationTriggerKinds } from '$lib/content/narration';

export const audiences = ['smp', 'sma'] as const;
export type Audience = (typeof audiences)[number];

export const narrationTriggers = narrationTriggerKinds;

export const narrationSources = ['ai', 'template'] as const;

const MAX_NAME = 60;
const MAX_TEXT = 1200;
const MAX_SEGMENTS = 6;
const MAX_CAUSES = 6;
const MAX_ACTIONS = 8;
const MAX_TERMS = 8;

const segmentId = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(6));
const shortText = v.pipe(v.string(), v.maxLength(MAX_NAME));

export const SegmentPayloadSchema = v.strictObject({
	id: segmentId,
	name: shortText,
	statusBefore: shortText,
	statusAfter: shortText,
	ip: v.number(),
	ipBefore: v.number(),
	do: v.number(),
	bod: v.number(),
	fecalColiform: v.number(),
	fish: v.number()
});

export const CausePayloadSchema = v.variant('type', [
	v.strictObject({
		type: v.literal('load'),
		source: shortText,
		segment: segmentId,
		shareOfBod: v.pipe(v.number(), v.minValue(0), v.maxValue(1))
	}),
	v.strictObject({ type: v.literal('season'), flowFactor: v.number() }),
	v.strictObject({ type: v.literal('event'), event: shortText }),
	v.strictObject({
		type: v.literal('intervention'),
		action: shortText,
		monthsActive: v.pipe(v.number(), v.integer())
	})
]);

export const IndicatorsPayloadSchema = v.strictObject({
	waterQuality: v.number(),
	fish: v.number(),
	floodRisk: v.number(),
	economy: v.number()
});

export const NarrationPayloadSchema = v.strictObject({
	kind: v.literal('change'),
	audience: v.picklist(audiences),
	month: v.pipe(v.number(), v.integer(), v.minValue(0)),
	calendarMonth: shortText,
	season: shortText,
	trigger: v.picklist(narrationTriggers),
	detail: v.pipe(v.string(), v.maxLength(MAX_NAME)),
	segments: v.pipe(v.array(SegmentPayloadSchema), v.minLength(1), v.maxLength(MAX_SEGMENTS)),
	causes: v.pipe(v.array(CausePayloadSchema), v.maxLength(MAX_CAUSES)),
	indicators: IndicatorsPayloadSchema,
	availableActions: v.pipe(v.array(v.picklist(actionTypes)), v.maxLength(MAX_ACTIONS))
});

export const NarrationOutputSchema = v.object({
	text: v.pipe(v.string(), v.minLength(1), v.maxLength(MAX_TEXT)),
	highlightSegments: v.optional(v.array(segmentId), []),
	glossaryTerms: v.optional(v.pipe(v.array(shortText), v.maxLength(MAX_TERMS)), []),
	suggestedAction: v.optional(v.nullable(v.string()), null),
	factId: v.optional(v.nullable(v.string()), null)
});

export const NarrationResultSchema = v.object({
	text: v.pipe(v.string(), v.minLength(1), v.maxLength(MAX_TEXT)),
	source: v.picklist(narrationSources),
	highlightSegments: v.array(segmentId),
	suggestedAction: v.nullable(v.picklist(actionTypes)),
	factId: v.nullable(v.string())
});

export type NarrationPayload = v.InferOutput<typeof NarrationPayloadSchema>;
export type SegmentPayload = v.InferOutput<typeof SegmentPayloadSchema>;
export type CausePayload = v.InferOutput<typeof CausePayloadSchema>;
export type NarrationOutput = v.InferOutput<typeof NarrationOutputSchema>;
export type NarrationResult = v.InferOutput<typeof NarrationResultSchema>;
export type NarrationTrigger = NarrationPayload['trigger'];
