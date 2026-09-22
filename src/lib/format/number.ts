const locale = 'id-ID';
const BILLION_MAX_DIGITS = 2;
const PERCENT_SCALE = 100;

export function formatNumber(value: number, digits = 0): string {
	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(value);
}

export function formatBillions(value: number): string {
	const amount = new Intl.NumberFormat(locale, {
		maximumFractionDigits: BILLION_MAX_DIGITS
	}).format(value);
	return `Rp ${amount} miliar`;
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
