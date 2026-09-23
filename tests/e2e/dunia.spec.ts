import { expect, test, type Page } from '@playwright/test';
import { gotoReady, tabKey } from '../ready';

function world(page: Page) {
	return page.locator('.world-stage');
}

function cell(page: Page, segment: number, column: number) {
	return page.locator(`[data-cell="${segment}-${column}"]`);
}

async function zoomOf(page: Page): Promise<number> {
	return Number((await world(page).getAttribute('data-zoom')) ?? '0');
}

async function plotOffset(page: Page, id: string): Promise<number> {
	const stage = await world(page).boundingBox();
	const plot = await page.locator(`[data-plot="${id}"] use`).first().boundingBox();
	if (stage === null || plot === null) return Number.POSITIVE_INFINITY;
	const dx = plot.x + plot.width / 2 - (stage.x + stage.width / 2);
	const dy = plot.y + plot.height / 2 - (stage.y + stage.height / 2);
	return Math.hypot(dx, dy);
}

test.describe('Dunia Sungai', () => {
	test('tombol kamera memperbesar, memperkecil, dan memperlihatkan seluruh sungai', async ({
		page
	}) => {
		await gotoReady(page, '/lab');
		await expect.poll(() => zoomOf(page)).toBeGreaterThan(0);
		const fit = await zoomOf(page);
		await page.getByRole('button', { name: 'Perbesar' }).click();
		await expect.poll(() => zoomOf(page)).toBeGreaterThan(fit * 1.4);
		const closer = await zoomOf(page);
		await page.getByRole('button', { name: 'Perkecil' }).click();
		await expect.poll(() => zoomOf(page)).toBeLessThan(closer);
		await page.getByRole('button', { name: 'Perbesar' }).click();
		await page.getByRole('button', { name: 'Lihat seluruh sungai' }).click();
		await expect.poll(() => zoomOf(page)).toBeCloseTo(fit, 2);
	});

	test('pintasan + - 0 dan F menggerakkan kamera dari area simulasi', async ({ page }) => {
		await gotoReady(page, '/lab');
		await expect.poll(() => zoomOf(page)).toBeGreaterThan(0);
		const fit = await zoomOf(page);
		await cell(page, 4, 1).focus();
		await expect.poll(() => plotOffset(page, 'S4-L1')).toBeLessThan(40);
		const followed = await zoomOf(page);
		await page.keyboard.press('+');
		await expect.poll(() => zoomOf(page)).toBeGreaterThan(followed * 1.4);
		await page.keyboard.press('-');
		await expect.poll(() => zoomOf(page)).toBeLessThan(followed * 1.1);
		await page.keyboard.press('0');
		await expect.poll(() => zoomOf(page)).toBeCloseTo(fit, 2);
		await page.keyboard.press('f');
		await expect.poll(() => zoomOf(page)).toBeGreaterThanOrEqual(1.1);
		await expect.poll(() => plotOffset(page, 'S4-L1')).toBeLessThan(40);
	});

	test('fokus petak di Peta Petak menerbangkan kamera ke lahan itu', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/lab');
		await page.getByRole('link', { name: 'Lewati ke panggung sungai' }).focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press(tabKey(browserName));
		await expect(cell(page, 1, 1)).toBeFocused();
		for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowDown');
		await expect(cell(page, 5, 1)).toBeFocused();
		await expect.poll(() => plotOffset(page, 'S5-L1')).toBeLessThan(40);
		await page.keyboard.press('ArrowRight');
		await page.keyboard.press('ArrowRight');
		await expect(cell(page, 5, 3)).toBeFocused();
		await expect.poll(() => plotOffset(page, 'S5-R1')).toBeLessThan(40);
	});

	test('klik lahan di dunia memilih petak yang sama dan membuka panel aksi yang sama', async ({
		page
	}) => {
		await gotoReady(page, '/lab');
		await cell(page, 4, 3).focus();
		await expect.poll(() => plotOffset(page, 'S4-R1')).toBeLessThan(40);
		await page.locator('[data-plot="S4-R2"] use').nth(1).click();
		const panel = page.getByRole('region', { name: 'Segmen 4 Kota, kanan jauh dari sungai' });
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await expect(cell(page, 4, 4)).toHaveAttribute('aria-pressed', 'true');
		await expect.poll(() => plotOffset(page, 'S4-R2')).toBeLessThan(40);
		await page.keyboard.press('Escape');
		await expect(panel).toHaveCount(0);
		await expect(cell(page, 4, 4)).toBeFocused();
		await expect(cell(page, 4, 4)).toHaveAttribute('aria-pressed', 'false');
	});

	test('satu siklus pasang pabrik lalu maju waktu hanya dengan keyboard', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/lab');
		const tab = tabKey(browserName);
		const factoryTool = page.getByRole('radio', { name: 'Pabrik', exact: true });
		await factoryTool.focus();
		await page.keyboard.press('Space');
		await expect(factoryTool).toBeChecked();
		await page.getByRole('link', { name: 'Lewati ke panggung sungai' }).focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press(tab);
		await page.keyboard.press('ArrowDown');
		await page.keyboard.press('ArrowDown');
		await expect(cell(page, 3, 1)).toBeFocused();
		await page.keyboard.press('Enter');
		const panel = page.getByRole('region', { name: 'Segmen 3 Tengah, kiri dekat sungai' });
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await expect(page.getByRole('button', { name: 'Pasang' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(cell(page, 3, 1)).toBeFocused();
		await expect(page.locator('[data-plot="S3-L1"] use[href="#world-factory"]')).toHaveCount(1);
		await page.keyboard.press('n');
		if ((await page.getByRole('dialog').count()) > 0) await page.keyboard.press('Escape');
		await expect(page.getByRole('region', { name: 'Lab Bebas' })).toContainText('(bulan 1)');
		await expect(cell(page, 3, 1)).toHaveAttribute(
			'aria-label',
			/^Segmen 3 Tengah, kiri dekat sungai: Pabrik tanpa IPAL\. Air segmen: /
		);
	});
});
