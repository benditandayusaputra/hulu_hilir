import { expect, test, type Page } from '@playwright/test';
import { gotoReady, tabKey } from '../ready';

function cell(page: Page, segment: number, column: number) {
	return page.locator(`[data-cell="${segment}-${column}"]`);
}

function hud(page: Page) {
	return page.getByRole('region', { name: 'Lab Bebas' });
}

function card(page: Page, name: string) {
	return page.getByRole('listitem').filter({ has: page.getByRole('heading', { level: 2, name }) });
}

async function stepWithKeyboard(page: Page): Promise<void> {
	await page.keyboard.press('n');
	if ((await page.getByRole('dialog').count()) > 0) await page.keyboard.press('Escape');
}

async function installFactory(page: Page, segment: number): Promise<void> {
	await cell(page, segment, 1).click();
	const panel = page.getByRole('region', { name: new RegExp(`^Segmen ${segment} .*kiri dekat`) });
	await panel.getByRole('radio', { name: 'Pabrik', exact: true }).check();
	await panel.getByRole('button', { name: 'Pasang' }).click();
	await expect(cell(page, segment, 1)).toBeFocused();
}

test.describe('Layar Pilih Skenario', () => {
	test('kartu dipilih dengan keyboard, sesi bertahan setelah muat ulang, dan demo tidak disimpan', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/lab');
		await expect(page).toHaveTitle('Pilih Skenario | Hulu Hilir');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pilih Skenario');
		await expect(page.getByRole('heading', { level: 2 })).toHaveText([
			'Sungai Alami',
			'Desa Berkembang',
			'Kota Padat',
			'Lahan Kosong'
		]);
		await expect(card(page, 'Kota Padat')).toContainText(/Kualitas Air\s*\d+ dari 100/);
		await expect(card(page, 'Kota Padat')).not.toContainText('Tersimpan');

		await page.getByRole('link', { name: 'Desa Berkembang' }).focus();
		await page.keyboard.press(tabKey(browserName));
		await expect(page.getByRole('link', { name: 'Kota Padat' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page).toHaveURL(/\/lab\/kota-padat$/);
		await expect(page).toHaveTitle('Lab Bebas: Kota Padat | Hulu Hilir');

		await installFactory(page, 2);
		await stepWithKeyboard(page);
		await stepWithKeyboard(page);
		await expect(hud(page)).toContainText('(bulan 2)');
		await installFactory(page, 3);

		await page.reload();
		await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
		await expect(hud(page)).toContainText('(bulan 2)');
		await expect(cell(page, 2, 1)).toHaveAttribute('aria-label', /: Pabrik tanpa IPAL\./);
		await expect(cell(page, 3, 1)).toHaveAttribute('aria-label', /: Pabrik tanpa IPAL\./);
		await expect(page.getByRole('button', { name: 'Batalkan aksi terakhir' })).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);

		await page.getByRole('link', { name: 'Ganti skenario' }).click();
		await expect(page).toHaveURL(/\/lab$/);
		await expect(card(page, 'Kota Padat')).toContainText('Tersimpan: bulan 2');
		await expect(card(page, 'Desa Berkembang')).not.toContainText('Tersimpan');

		await gotoReady(page, '/lab?preset=demo');
		await expect(page).toHaveURL(/\/lab\/demo$/);
		await expect(page).toHaveTitle('Lab Bebas: Demo | Hulu Hilir');
		await cell(page, 1, 1).focus();
		await stepWithKeyboard(page);
		await expect(hud(page)).toContainText('(bulan 1)');
		await page.reload();
		await expect(hud(page)).toContainText('(bulan 0)');
		expect(await page.evaluate(() => localStorage.getItem('hh:session:lab:demo'))).toBeNull();
	});

	test('id skenario yang tidak dikenal dialihkan ke Pilih Skenario', async ({ page }) => {
		await gotoReady(page, '/lab/sungai-asing');
		await expect(page).toHaveURL(/\/lab$/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pilih Skenario');
	});

	test('sesi tersimpan yang rusak diatur ulang dengan pemberitahuan', async ({ page }) => {
		await gotoReady(page, '/lab');
		await page.evaluate(() => localStorage.setItem('hh:session:lab:desa', '{"rusak":true}'));
		await gotoReady(page, '/lab/desa');
		await expect(page.locator('[aria-live="polite"]')).toHaveText(
			'Sesi tersimpan untuk skenario ini tidak bisa dibaca, jadi Lab dimulai dari awal.'
		);
		await expect(hud(page)).toContainText('(bulan 0)');
		expect(await page.evaluate(() => localStorage.getItem('hh:session:lab:desa'))).toBeNull();
	});
});
