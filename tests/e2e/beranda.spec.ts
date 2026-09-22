import { expect, test } from '@playwright/test';
import { gotoReady } from '../ready';

test.describe('Beranda', () => {
	test('memuat judul, landmark, dan bahasa Indonesia', async ({ page }) => {
		await gotoReady(page, '/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'id');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hulu Hilir');
		await expect(page.getByRole('main')).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Utama' })).toBeVisible();
		await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible();
	});

	test('tautan lewati menjadi fokus pertama dan memindahkan fokus ke konten utama', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/');
		await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
		const skipLink = page.getByRole('link', { name: 'Lewati ke konten utama' });
		await expect(skipLink).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('main')).toBeFocused();
	});

	test('dialog pengaturan dibuka dengan keyboard, ditutup dengan Escape, dan fokus kembali ke pemicu', async ({
		page
	}) => {
		await gotoReady(page, '/');
		const trigger = page.getByRole('button', { name: 'Pengaturan' });
		await trigger.focus();
		await page.keyboard.press('Enter');
		const dialog = page.getByRole('dialog', { name: 'Pengaturan' });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByRole('heading', { name: 'Pengaturan' })).toBeFocused();
		await page.keyboard.press('Escape');
		await expect(dialog).toBeHidden();
		await expect(trigger).toBeFocused();
	});

	test('pilihan tema tersimpan dan diterapkan ke elemen akar', async ({ page }) => {
		await gotoReady(page, '/');
		await page.getByRole('button', { name: 'Pengaturan' }).click();
		await page.getByRole('radio', { name: 'Gelap' }).check();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		await gotoReady(page, '/');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});
});
