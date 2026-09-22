const locale = 'id-ID';
const BILLION_MAX_DIGITS = 2;
const PERCENT_SCALE = 100;

const fixedFormatters = new Map<number, Intl.NumberFormat>();
const billionFormatter = new Intl.NumberFormat(locale, {
	maximumFractionDigits: BILLION_MAX_DIGITS
});
const compactFormatter = new Intl.NumberFormat(locale, {
	notation: 'compact',
	maximumFractionDigits: 1
});

function fixedFormatter(digits: number): Intl.NumberFormat {
	const cached = fixedFormatters.get(digits);
	if (cached !== undefined) return cached;
	const created = new Intl.NumberFormat(locale, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	});
	fixedFormatters.set(digits, created);
	return created;
}

export function formatNumber(value: number, digits = 0): string {
	return fixedFormatter(digits).format(value);
}

export function formatBillions(value: number): string {
	return `Rp ${billionFormatter.format(value)} miliar`;
}

const COMPACT_THRESHOLD = 10000;

export function formatCompact(value: number): string {
	if (Math.abs(value) < COMPACT_THRESHOLD) return formatNumber(value);
	return compactFormatter.format(value);
}

export function formatPercent(share: number): string {
	return `${Math.round(share * PERCENT_SCALE)}%`;
}

export function formatScore(value: number): string {
	return formatNumber(Math.round(value));
}

export function formatSignedScore(delta: number): string {
	const rounded = Math.round(delta);
	if (rounded > 0) return `+${formatNumber(rounded)}`;
	return formatNumber(rounded);
}
