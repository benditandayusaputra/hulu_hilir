import { expect, test, type Page } from '@playwright/test';
import { gotoReady, tabKey } from '../ready';

function cell(page: Page, segment: number, column: number) {
	return page.locator(`[data-cell="${segment}-${column}"]`);
}

const waterNamePattern =
	/^Segmen 2 Hulu, air: (Baik|Cemar ringan|Cemar sedang|Cemar berat), IP \d+,\d, ikan \d+ dari 100, banjir (Aman|Siaga|Banjir ringan|Banjir besar)\. Tekan Enter untuk aksi segmen\.$/;

test.describe('Lab: panggung sungai', () => {
	test('memuat judul, tautan lewati, dan grup sungai enam segmen', async ({ page }) => {
		await gotoReady(page, '/lab');
		await expect(page).toHaveTitle('Lab Bebas | Hulu Hilir');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lab Bebas');
		await expect(page.getByRole('link', { name: 'Lewati ke panggung sungai' })).toHaveCount(1);
		await expect(page.getByRole('link', { name: 'Lewati ke kontrol waktu' })).toHaveCount(1);
		const stage = page.getByRole('group', { name: 'Sungai, 6 segmen dari hulu ke muara' });
		await expect(stage).toBeVisible();
		await expect(stage.getByRole('group')).toHaveCount(6);
		await expect(stage.getByRole('button')).toHaveCount(30);
	});

	test('panggung adalah satu tab stop dan panah mengikuti peta keyboard', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/lab');
		await page.getByRole('link', { name: 'Lewati ke panggung sungai' }).focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press(tabKey(browserName));
		await expect(cell(page, 1, 1)).toBeFocused();
		await page.keyboard.press('ArrowDown');
		await expect(cell(page, 2, 1)).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(cell(page, 2, 2)).toBeFocused();
		await expect(cell(page, 2, 2)).toHaveAttribute('aria-label', waterNamePattern);
		await page.keyboard.press('End');
		await expect(cell(page, 2, 4)).toBeFocused();
		await page.keyboard.press('Home');
		await expect(cell(page, 2, 0)).toBeFocused();
		await page.keyboard.press('Control+End');
		await expect(cell(page, 6, 0)).toBeFocused();
		await page.keyboard.press('Control+Home');
		await expect(cell(page, 1, 0)).toBeFocused();
		await page.keyboard.press('ArrowUp');
		await expect(cell(page, 1, 0)).toBeFocused();
		await page.keyboard.press(tabKey(browserName));
		await expect(cell(page, 1, 0)).not.toBeFocused();
		await expect(page.locator('[data-cell][tabindex="0"]')).toHaveCount(1);
	});

	test('nama petak mengikuti pola segmen, sisi, lahan, dan air segmen', async ({ page }) => {
		await gotoReady(page, '/lab');
		await expect(cell(page, 3, 1)).toHaveAttribute(
			'aria-label',
			/^Segmen 3 Tengah, kiri dekat sungai: Permukiman\. Air segmen: (Baik|Cemar ringan|Cemar sedang|Cemar berat)\.$/
		);
		await expect(cell(page, 1, 4)).toHaveAttribute(
			'aria-label',
			/^Segmen 1 Hulu Atas, kanan jauh dari sungai: Hutan\. Air segmen: Baik\.$/
		);
	});

	test('lebar 320 px tanpa gulir mendatar dan petak minimal 56 px', async ({ page }) => {
		await page.setViewportSize({ width: 320, height: 720 });
		await gotoReady(page, '/lab');
		const widths = await page.evaluate(() => ({
			scroll: document.documentElement.scrollWidth,
			client: document.documentElement.clientWidth
		}));
		expect(widths.scroll).toBeLessThanOrEqual(widths.client);
		const box = await cell(page, 1, 1).boundingBox();
		expect(box?.width ?? 0).toBeGreaterThanOrEqual(56);
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(56);
	});
});
