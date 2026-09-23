import { expect, test, type Page } from '@playwright/test';
import { gotoReady } from '../ready';

function cell(page: Page, segment: number, column: number) {
	return page.locator(`[data-cell="${segment}-${column}"]`);
}

async function stepMonth(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
	const dialogs = page.getByRole('dialog');
	if ((await dialogs.count()) > 0) await page.keyboard.press('Escape');
}

test.describe('Narator dan kejadian', () => {
	test('narasi otomatis dipakai saat AI membalas angka asing', async ({ page }) => {
		await gotoReady(page, '/lab/desa');
		await cell(page, 2, 1).click();
		const panel = page.getByRole('region', { name: 'Segmen 2 Hulu, kiri dekat sungai' });
		await panel.getByRole('radio', { name: 'Pabrik', exact: true }).check();
		await panel.getByRole('button', { name: 'Pasang' }).click();
		const narrationResponse = page.waitForResponse(
			(response) =>
				response.url().includes('/api/ai/narration') &&
				(response.request().postData() ?? '').includes('"trigger":"status_change"')
		);
		for (let i = 0; i < 8; i += 1) await stepMonth(page);
		const body = await (await narrationResponse).json();
		expect(body.source).toBe('template');
		expect(body.text).not.toContain('999,9');
		const narrator = page.getByRole('region', { name: 'Narator' });
		await expect(narrator.getByText('Narasi otomatis')).toBeVisible({ timeout: 10000 });
		await expect(narrator.getByText(/Segmen \d/)).toBeVisible();
	});

	test('kejadian membuka Kabar Kali, menjeda simulasi, dan narasi AI yang valid tampil', async ({
		page
	}) => {
		await gotoReady(page, '/lab/demo');
		await page.getByRole('radio', { name: '4x' }).check();
		await page.getByRole('button', { name: 'Putar' }).click();
		const dialog = page.getByRole('dialog', { name: /Hujan ekstrem|Banjir/ });
		await expect(dialog).toBeVisible({ timeout: 10000 });
		await expect(dialog.getByRole('heading', { level: 2 })).toBeFocused();
		await expect(dialog.getByText(/^Kabar Kali, /)).toBeVisible();
		await expect(page.getByRole('button', { name: 'Putar' })).toBeVisible();
		await expect(
			page.getByRole('region', { name: 'Lab Bebas' }).getByText(/\(bulan 2\)/)
		).toBeVisible();
		await dialog.getByRole('button', { name: 'Lanjutkan' }).click();
		await expect(dialog).toBeHidden();
		const narrator = page.getByRole('region', { name: 'Narator' });
		await expect(narrator.getByText('Narasi AI')).toBeVisible({ timeout: 10000 });
		await expect(narrator.getByText(/Air sungai berubah bulan ini/)).toBeVisible();
	});
});
