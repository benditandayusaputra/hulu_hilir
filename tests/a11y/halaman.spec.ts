import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoReady, settleAnimations } from '../ready';

const routes = ['/', '/lab'];

for (const route of routes) {
	test(`axe nol pelanggaran di ${route}`, async ({ page }) => {
		await gotoReady(page, route);
		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});
}

test('axe nol pelanggaran saat dialog pengaturan terbuka', async ({ page }) => {
	await gotoReady(page, '/');
	await page.getByRole('button', { name: 'Pengaturan' }).click();
	await expect(page.getByRole('dialog', { name: 'Pengaturan' })).toBeVisible();
	await settleAnimations(page);
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

for (const route of routes) {
	test(`axe nol pelanggaran di tema gelap untuk ${route}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await gotoReady(page, route);
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
		const results = await new AxeBuilder({ page }).analyze();
		expect(results.violations).toEqual([]);
	});
}

test('axe nol pelanggaran saat panel aksi Lab terbuka', async ({ page }) => {
	await gotoReady(page, '/lab');
	await page.locator('[data-cell="2-1"]').click();
	await expect(
		page.getByRole('region', { name: 'Segmen 2 Hulu, kiri dekat sungai' })
	).toBeVisible();
	await settleAnimations(page);
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('axe nol pelanggaran saat simulasi Lab berjalan', async ({ page }) => {
	await gotoReady(page, '/lab');
	await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
	await page.getByRole('button', { name: 'Putar' }).click();
	await expect(page.getByRole('button', { name: 'Jeda' })).toBeVisible();
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('axe nol pelanggaran saat Tampilan Tabel dan Mode Ilmiah aktif', async ({ page }) => {
	await gotoReady(page, '/lab');
	await page.getByRole('button', { name: 'Tampilan Tabel' }).click();
	await page.getByRole('switch', { name: 'Mode Ilmiah' }).click();
	await page.getByText('Lihat data').click();
	await expect(page.getByRole('table', { name: 'Riwayat indikator' })).toBeVisible();
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});
