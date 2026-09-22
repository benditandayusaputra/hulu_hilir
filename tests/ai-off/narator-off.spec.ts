import { expect, test } from '@playwright/test';
import { gotoReady } from '../ready';

test('tanpa AI narasi otomatis tampil dan tidak ada permintaan ke /api/ai', async ({ page }) => {
	const aiRequests: string[] = [];
	page.on('request', (request) => {
		if (request.url().includes('/api/ai')) aiRequests.push(request.url());
	});
	await gotoReady(page, '/lab?preset=demo');
	for (let i = 0; i < 2; i += 1) {
		await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
		if ((await page.getByRole('dialog').count()) > 0) await page.keyboard.press('Escape');
	}
	const narrator = page.getByRole('region', { name: 'Narator' });
	await expect(narrator.getByText('Narasi otomatis')).toBeVisible({ timeout: 10000 });
	await expect(narrator.getByText(/Segmen \d/)).toBeVisible();
	expect(aiRequests).toEqual([]);
});
