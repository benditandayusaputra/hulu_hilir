import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoReady, settleAnimations } from '../ready';

const routes = ['/', '/lab', '/dev/galeri'];

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
	await page.getByRole('tab', { name: 'Inspektor' }).click();
	await page.getByRole('switch', { name: 'Mode Ilmiah' }).click();
	await page.getByRole('tab', { name: 'Riwayat' }).click();
	await page.getByText('Lihat data').click();
	await expect(page.getByRole('table', { name: 'Riwayat indikator' })).toBeVisible();
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('axe nol pelanggaran di lebar 320 px saat Peta Petak dan panel aksi terbuka', async ({
	page
}) => {
	await page.setViewportSize({ width: 320, height: 720 });
	await gotoReady(page, '/lab');
	expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	await page.getByRole('button', { name: 'Peta Petak' }).click();
	await expect(page.getByRole('dialog', { name: 'Peta Petak' })).toBeVisible();
	await settleAnimations(page);
	expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
	await page.locator('[data-cell="3-2"]').click();
	await expect(page.getByRole('dialog', { name: 'Segmen 3 Tengah, air' })).toBeVisible();
	await settleAnimations(page);
	expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test('axe nol pelanggaran di lebar 800 px dengan tab panel', async ({ page }) => {
	await page.setViewportSize({ width: 800, height: 900 });
	await gotoReady(page, '/lab');
	await page.getByRole('button', { name: 'Tampilkan panel' }).click();
	await page.getByRole('tab', { name: 'Inspektor' }).click();
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('axe nol pelanggaran saat dialog kejadian Kabar Kali terbuka', async ({ page }) => {
	await gotoReady(page, '/lab?preset=demo');
	await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
	await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
	await expect(page.getByRole('dialog', { name: /Hujan ekstrem|Banjir/ })).toBeVisible();
	await settleAnimations(page);
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});
