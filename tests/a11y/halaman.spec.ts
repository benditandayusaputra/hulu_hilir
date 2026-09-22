import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { gotoReady } from '../ready';

const routes = ['/'];

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
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});

test('axe nol pelanggaran di tema gelap', async ({ page }) => {
	await page.emulateMedia({ colorScheme: 'dark' });
	await gotoReady(page, '/');
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	const results = await new AxeBuilder({ page }).analyze();
	expect(results.violations).toEqual([]);
});
