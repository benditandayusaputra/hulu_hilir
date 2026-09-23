export type Rgb = readonly [number, number, number];

const channelMax = 255;
const linearThreshold = 0.03928;
const luminanceWeights: Rgb = [0.2126, 0.7152, 0.0722];
const flare = 0.05;

export function parseRgb(css: string): Rgb | null {
	const match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(css.trim());
	if (!match) return null;
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function luminance(color: Rgb): number {
	return color.reduce((sum, channel, index) => {
		const value = channel / channelMax;
		const linear = value <= linearThreshold ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
		return sum + linear * (luminanceWeights[index] ?? 0);
	}, 0);
}

export function contrastRatio(first: Rgb, second: Rgb): number {
	const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
	return ((light ?? 0) + flare) / ((dark ?? 0) + flare);
}

export function parseHex(hex: string): Rgb | null {
	const match = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
	if (!match) return null;
	return [parseInt(match[1] ?? '', 16), parseInt(match[2] ?? '', 16), parseInt(match[3] ?? '', 16)];
}
