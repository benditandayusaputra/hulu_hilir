const EM_DASH = '—';
const SENTENCE_END = /[.!?]$/;

export function replaceEmDash(text: string): string {
	return text.replaceAll(new RegExp(`\\s*${EM_DASH}\\s*`, 'g'), ', ');
}

export function stripCodeFence(text: string): string {
	const trimmed = text.trim();
	const match = /^```[a-z]*\s*([\s\S]*?)\s*```$/i.exec(trimmed);
	return match?.[1] ?? trimmed;
}

export function countWords(text: string): number {
	return text.split(/\s+/).filter((word) => word !== '').length;
}

export function limitWords(text: string, max: number): string {
	const words = text.split(/\s+/).filter((word) => word !== '');
	if (words.length <= max) return words.join(' ');
	const kept = words.slice(0, max);
	for (let i = kept.length - 1; i >= 0; i -= 1) {
		if (SENTENCE_END.test(kept[i] ?? '')) return kept.slice(0, i + 1).join(' ');
	}
	return `${kept.join(' ')}.`;
}

export function normalizeWhitespace(text: string): string {
	return text.replace(/\s+/g, ' ').trim();
}
