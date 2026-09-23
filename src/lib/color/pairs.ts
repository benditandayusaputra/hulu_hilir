export const TEXT_CONTRAST = 4.5;
export const GRAPHIC_CONTRAST = 3;

export const contrastPairIds = [
	'inkBg',
	'mutedBg',
	'inkSurface',
	'inkSurface2',
	'inkPaper',
	'mutedPaper',
	'inkPaper2',
	'mutedPaper2',
	'linkPaper',
	'onPrimary',
	'accentPaper',
	'dangerPaper',
	'plankLight',
	'plankWood',
	'plankDark',
	'plankGrain',
	'knobLight',
	'knob',
	'knobOn',
	'news',
	'tooltip',
	'stamp'
] as const;

export type ContrastPairId = (typeof contrastPairIds)[number];

export interface ContrastPair {
	id: ContrastPairId;
	fg: string;
	bg: string;
	target: number;
}

function text(id: ContrastPairId, fg: string, bg: string): ContrastPair {
	return { id, fg: `--color-${fg}`, bg: `--color-${bg}`, target: TEXT_CONTRAST };
}

export const contrastPairs: readonly ContrastPair[] = [
	text('inkBg', 'ink', 'bg'),
	text('mutedBg', 'ink-muted', 'bg'),
	text('inkSurface', 'ink', 'surface'),
	text('inkSurface2', 'ink', 'surface-2'),
	text('inkPaper', 'ink', 'paper'),
	text('mutedPaper', 'ink-muted', 'paper'),
	text('inkPaper2', 'ink', 'paper-2'),
	text('mutedPaper2', 'ink-muted', 'paper-2'),
	text('linkPaper', 'primary', 'paper'),
	text('onPrimary', 'on-primary', 'primary'),
	text('accentPaper', 'accent-ink', 'paper'),
	text('dangerPaper', 'danger', 'paper'),
	text('plankLight', 'plank-ink', 'wood-light'),
	text('plankWood', 'plank-ink', 'wood'),
	text('plankDark', 'plank-ink', 'wood-dark'),
	text('plankGrain', 'plank-ink', 'wood-grain'),
	text('knobLight', 'outline', 'knob-light'),
	text('knob', 'outline', 'knob'),
	text('knobOn', 'outline', 'glow'),
	text('news', 'news-ink', 'newsprint'),
	text('tooltip', 'bg', 'ink'),
	{ id: 'stamp', fg: '--color-stamp', bg: '--color-paper', target: GRAPHIC_CONTRAST }
];
