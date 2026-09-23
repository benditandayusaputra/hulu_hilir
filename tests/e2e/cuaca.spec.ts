import { expect, test, type Page } from '@playwright/test';
import { gotoReady } from '../ready';

function stage(page: Page) {
	return page.locator('.world-stage');
}

function weatherLayer(page: Page) {
	return page.locator('.world-weather');
}

function cell(page: Page, segment: number, column: number) {
	return page.locator(`[data-cell="${segment}-${column}"]`);
}

async function closeDialog(page: Page): Promise<void> {
	if ((await page.getByRole('dialog').count()) > 0) await page.keyboard.press('Escape');
}

async function reachExtremeRain(page: Page): Promise<void> {
	await page.keyboard.press('n');
	await closeDialog(page);
	await page.keyboard.press('n');
	await expect(page.getByRole('dialog', { name: /Hujan ekstrem|Banjir/ })).toBeVisible();
	await expect(stage(page)).toHaveAttribute('data-weather', 'extreme');
}

test.describe('Cuaca di dunia', () => {
	test('bulan 2 demo menulis data-weather extreme, hujan bergerak 4 detik lalu diam', async ({
		page
	}) => {
		await gotoReady(page, '/lab/demo');
		await expect(stage(page)).toHaveAttribute('data-weather', 'cloudy');
		await expect(page.locator('.world-rain')).toHaveCount(0);
		await cell(page, 1, 1).focus();
		await reachExtremeRain(page);
		await expect(page.locator('.world-rain')).toHaveCount(1);
		await expect(weatherLayer(page)).not.toHaveAttribute('data-moving');
		await page.keyboard.press('Escape');
		await expect(weatherLayer(page)).toHaveAttribute('data-moving', '');
		await expect(page.getByRole('button', { name: 'Putar' })).toBeVisible();
		await expect(weatherLayer(page)).not.toHaveAttribute('data-moving', { timeout: 6000 });
		await expect(page.locator('.world-rain')).toHaveCount(1);
		await expect(page.locator('.world-clouds use')).toHaveCount(12);
	});

	test('dengan gerak dikurangi lapisan hujan tidak bergerak', async ({ page }) => {
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await gotoReady(page, '/lab/demo');
		await cell(page, 1, 1).focus();
		await reachExtremeRain(page);
		await page.keyboard.press('Escape');
		const rain = page.locator('.world-rain');
		await expect(rain).toHaveCount(1);
		await expect(weatherLayer(page)).not.toHaveAttribute('data-moving');
		const running = () =>
			rain.evaluate(
				(element) =>
					element.getAnimations().filter((animation) => animation.playState === 'running').length
			);
		const transform = () => rain.evaluate((element) => getComputedStyle(element).transform);
		expect(await running()).toBe(0);
		const before = await transform();
		await page.waitForTimeout(500);
		expect(await transform()).toBe(before);
		expect(await running()).toBe(0);
	});

	test('hujan ekstrem di zoom Dekat mempertahankan minimal 30 fps', async ({
		page,
		browserName
	}) => {
		test.skip(browserName !== 'chromium', 'Frame diukur di Chromium saja');
		await gotoReady(page, '/lab/demo');
		await cell(page, 2, 1).focus();
		await page.keyboard.press('f');
		await expect(stage(page)).toHaveAttribute('data-level', 'near');
		await reachExtremeRain(page);
		await page.keyboard.press('Escape');
		await expect(weatherLayer(page)).toHaveAttribute('data-moving', '');
		await expect(stage(page)).toHaveAttribute('data-level', 'near');
		const gaps = await page.evaluate(
			() =>
				new Promise<number[]>((resolve) => {
					const found: number[] = [];
					const start = performance.now();
					let last = start;
					const tick = (now: number) => {
						found.push(now - last);
						last = now;
						if (now - start < 3000) requestAnimationFrame(tick);
						else resolve(found.slice(1));
					};
					requestAnimationFrame(tick);
				})
		);
		const total = gaps.reduce((sum, gap) => sum + gap, 0);
		const fps = (gaps.length / total) * 1000;
		expect(gaps.length).toBeGreaterThan(30);
		expect(fps).toBeGreaterThanOrEqual(30);
		expect(Math.max(...gaps)).toBeLessThan(250);
	});
});
