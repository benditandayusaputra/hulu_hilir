import { expect, test, type Page } from '@playwright/test';
import { gotoReady, tabKey } from '../ready';

declare global {
	interface Window {
		frameGaps?: number[];
	}
}

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
		await page.getByRole('button', { name: 'Inspektor Segmen' }).click();
		const inspector = page.getByRole('dialog', { name: 'Inspektor Segmen' });
		await inspector.getByRole('switch', { name: 'Mode Ilmiah' }).click();
		await expect(inspector.getByRole('table')).toBeVisible();
		const sheet = await inspector.evaluate((element) => ({
			scroll: element.scrollWidth,
			client: element.clientWidth
		}));
		expect(sheet.scroll).toBeLessThanOrEqual(sheet.client);
		await page.keyboard.press('Escape');
		await page.getByRole('button', { name: 'Tampilan Tabel' }).click();
		await page.getByText('Lihat data').click();
		const after = await page.evaluate(() => ({
			scroll: document.documentElement.scrollWidth,
			client: document.documentElement.clientWidth
		}));
		expect(after.scroll).toBeLessThanOrEqual(after.client);
	});
});

test.describe('Lab: alat, panel aksi, dan waktu', () => {
	test('memasang pabrik lalu IPAL hanya dengan keyboard dan memajukan waktu', async ({
		page,
		browserName
	}) => {
		await gotoReady(page, '/lab');
		const tab = tabKey(browserName);
		const factoryTool = page.getByRole('radio', { name: 'Pabrik', exact: true });
		await factoryTool.focus();
		await page.keyboard.press('Space');
		await expect(factoryTool).toBeChecked();
		await expect(page.getByText('Alat terpilih: Pabrik', { exact: true })).toBeVisible();

		await page.getByRole('link', { name: 'Lewati ke panggung sungai' }).focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press(tab);
		await page.keyboard.press('ArrowDown');
		await expect(cell(page, 2, 1)).toBeFocused();
		await expect(cell(page, 2, 1)).toHaveAccessibleDescription(
			'Alat terpilih: Pabrik. Tekan Enter untuk memasang.'
		);
		await page.keyboard.press('Enter');
		const panel = page.getByRole('region', { name: 'Segmen 2 Hulu, kiri dekat sungai' });
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await expect(panel.getByRole('radio', { name: 'Pabrik', exact: true })).toBeChecked();
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await expect(page.getByRole('button', { name: 'Pasang' })).toBeFocused();
		await page.keyboard.press('Enter');
		await expect(panel).toHaveCount(0);
		await expect(cell(page, 2, 1)).toBeFocused();
		await expect(cell(page, 2, 1)).toHaveAttribute(
			'aria-label',
			/^Segmen 2 Hulu, kiri dekat sungai: Pabrik tanpa IPAL\. Air segmen: /
		);

		const ipalTool = page.getByRole('radio', { name: 'IPAL Industri', exact: true });
		await ipalTool.focus();
		await page.keyboard.press('Space');
		await page.getByRole('link', { name: 'Lewati ke panggung sungai' }).focus();
		await page.keyboard.press('Enter');
		await page.keyboard.press(tab);
		await expect(cell(page, 2, 1)).toBeFocused();
		await expect(cell(page, 2, 1)).toHaveAccessibleDescription(
			'Alat terpilih: IPAL Industri, biaya Rp 8 miliar. Tekan Enter untuk memasang.'
		);
		await expect(cell(page, 1, 1)).toHaveAccessibleDescription(
			'IPAL Industri tidak bisa dipasang di Hutan.'
		);
		await page.keyboard.press('Enter');
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await page.keyboard.press(tab);
		await page.keyboard.press(tab);
		await page.keyboard.press('Enter');
		await expect(cell(page, 2, 1)).toHaveAttribute(
			'aria-label',
			/^Segmen 2 Hulu, kiri dekat sungai: Pabrik, IPAL Industri\. Air segmen: /
		);

		const quality = page.getByRole('meter', { name: 'Kualitas Air' });
		const before = await quality.getAttribute('aria-valuenow');
		for (let i = 0; i < 6; i += 1) await page.keyboard.press('n');
		await expect(page.getByText('Tahun 1, Juni (bulan 6)')).toBeVisible();
		await expect(quality).not.toHaveAttribute('aria-valuenow', before ?? '');
		await expect(quality).toHaveAttribute('aria-valuetext', /dari 100, (naik|turun|tetap)/);
	});

	test('escape menutup panel aksi dan mengembalikan fokus ke sel asal', async ({ page }) => {
		await gotoReady(page, '/lab');
		await cell(page, 3, 2).click();
		const panel = page.getByRole('region', { name: 'Segmen 3 Tengah, air' });
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await expect(cell(page, 3, 2)).toHaveAttribute('aria-pressed', 'true');
		await page.keyboard.press('Escape');
		await expect(panel).toHaveCount(0);
		await expect(cell(page, 3, 2)).toBeFocused();
		await expect(cell(page, 3, 2)).toHaveAttribute('aria-pressed', 'false');
	});

	test('putar, jeda, kecepatan, dan batalkan aksi bekerja lewat kontrol waktu', async ({
		page
	}) => {
		await gotoReady(page, '/lab');
		const play = page.getByRole('button', { name: 'Putar' });
		await expect(play).toHaveAccessibleDescription('Pintasan: P');
		await page.getByRole('radio', { name: '4x' }).check();
		await play.click();
		await expect(page.getByRole('button', { name: 'Jeda' })).toBeVisible();
		await expect(page.getByText(/\(bulan [1-9]\d*\)/)).toBeVisible();
		await page.getByRole('button', { name: 'Jeda' }).click();
		await expect(page.getByRole('button', { name: 'Putar' })).toBeVisible();
		const undo = page.getByRole('button', { name: 'Batalkan aksi terakhir' });
		await expect(undo).toHaveAttribute('aria-disabled', 'true');
		await expect(undo).toHaveAccessibleDescription('Tidak ada aksi yang menunggu');
		await cell(page, 4, 2).click();
		const panel = page.getByRole('region', { name: 'Segmen 4 Kota, air' });
		await panel.getByRole('radio', { name: /^Sabuk Hijau Bantaran/ }).check();
		await page.getByRole('button', { name: 'Pasang' }).click();
		await expect(cell(page, 4, 2)).toBeFocused();
		await expect(undo).not.toHaveAttribute('aria-disabled', 'true');
		await undo.click();
		await expect(undo).toHaveAttribute('aria-disabled', 'true');
	});

	test('ganti skenario meminta konfirmasi setelah ada kemajuan', async ({ page }) => {
		await gotoReady(page, '/lab');
		const select = page.getByLabel('Skenario awal');
		await select.selectOption('alami');
		await expect(cell(page, 3, 1)).toHaveAttribute('aria-label', /: Hutan\. Air segmen: Baik\.$/);
		await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
		await select.selectOption('kota-padat');
		const dialog = page.getByRole('dialog', { name: 'Ganti skenario?' });
		await expect(dialog).toBeVisible();
		await dialog.getByRole('button', { name: 'Ganti' }).click();
		await expect(dialog).toBeHidden();
		await expect(page.getByText('Tahun 1, Januari (bulan 0)')).toBeVisible();
		await expect(cell(page, 4, 1)).toHaveAttribute('aria-label', /: Permukiman padat\./);
	});
});

test.describe('Lab: inspektor, tabel, dan grafik', () => {
	test('inspektor mengikuti segmen yang difokus dan Mode Ilmiah menampilkan tabel parameter', async ({
		page
	}) => {
		await gotoReady(page, '/lab');
		const inspector = page.getByRole('region', { name: 'Inspektor Segmen' });
		await expect(inspector.getByRole('heading', { level: 3 })).toHaveText('Segmen 1 Hulu Atas');
		await cell(page, 4, 2).click();
		await page.keyboard.press('Escape');
		await expect(inspector.getByRole('heading', { level: 3 })).toHaveText('Segmen 4 Kota');
		await expect(inspector.getByText(/^Sumber beban: /)).toBeVisible();
		await expect(inspector.getByText(/Sensitif/)).toBeVisible();
		const toggle = inspector.getByRole('switch', { name: 'Mode Ilmiah' });
		await expect(toggle).toHaveAttribute('aria-checked', 'false');
		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
		const table = inspector.getByRole('table', {
			name: 'Parameter mutu air terhadap baku kelas 2'
		});
		await expect(table).toBeVisible();
		await expect(
			table.getByRole('rowheader', { name: 'Oksigen terlarut (DO) (mg/L)' })
		).toBeVisible();
		await expect(table.getByRole('row')).toHaveCount(8);
	});

	test('tampilan tabel dibuka lewat tombol dan pintasan T', async ({ page }) => {
		await gotoReady(page, '/lab');
		const toggle = page.getByRole('button', { name: 'Tampilan Tabel' });
		await expect(toggle).toHaveAttribute('aria-expanded', 'false');
		await toggle.click();
		await expect(toggle).toHaveAttribute('aria-expanded', 'true');
		const table = page.getByRole('table', {
			name: 'Status, ikan, dan risiko banjir per segmen'
		});
		await expect(table).toBeVisible();
		await expect(table.getByRole('rowheader')).toHaveCount(6);
		await expect(
			page.getByRole('table', { name: 'Parameter mutu air dan sampah per segmen' })
		).toBeVisible();
		await cell(page, 1, 1).focus();
		await page.keyboard.press('t');
		await expect(table).toBeHidden();
		await page.keyboard.press('t');
		await expect(table).toBeVisible();
		await page.keyboard.press('i');
		await expect(page.locator('[aria-live="polite"]')).toHaveText(/^Segmen 1 Hulu Atas, air: /);
	});

	test('grafik riwayat punya ringkasan dan tabel data', async ({ page }) => {
		await gotoReady(page, '/lab');
		for (let i = 0; i < 3; i += 1) await page.getByRole('button', { name: 'Maju 1 bulan' }).click();
		const figure = page.getByRole('figure');
		await expect(figure).toContainText(/Kualitas Air dari \d+ ke \d+ dalam 3 bulan\./);
		await figure.getByText('Lihat data').click();
		const table = figure.getByRole('table', { name: 'Riwayat indikator' });
		await expect(table.getByRole('rowheader')).toHaveCount(4);
		await expect(table.getByRole('columnheader', { name: 'Risiko Banjir' })).toBeVisible();
	});
});

test.describe('Lab: tata letak responsif dan performa', () => {
	test('di lebar 360 px palet dan panel aksi tampil sebagai lembar', async ({ page }) => {
		await page.setViewportSize({ width: 360, height: 740 });
		await gotoReady(page, '/lab');
		await page.getByRole('button', { name: 'Alat', exact: true }).focus();
		await page.keyboard.press('Enter');
		const sheet = page.getByRole('dialog', { name: 'Palet alat' });
		await expect(sheet).toBeVisible();
		await sheet.getByRole('radio', { name: 'Pabrik', exact: true }).check();
		await sheet.getByRole('button', { name: 'Tutup' }).click();
		await expect(sheet).toBeHidden();
		await expect(page.getByRole('button', { name: 'Alat', exact: true })).toBeFocused();
		await cell(page, 2, 1).click();
		const panel = page.getByRole('dialog', { name: 'Segmen 2 Hulu, kiri dekat sungai' });
		await expect(panel).toBeVisible();
		await expect(panel.getByRole('heading', { level: 2 })).toBeFocused();
		await panel.getByRole('button', { name: 'Pasang' }).click();
		await expect(panel).toBeHidden();
		await expect(cell(page, 2, 1)).toHaveAttribute('aria-label', /Pabrik tanpa IPAL/);
		await expect(cell(page, 2, 1)).toBeFocused();
		const time = await page.getByRole('region', { name: 'Kontrol waktu' }).boundingBox();
		expect((time?.y ?? 0) + (time?.height ?? 0)).toBeLessThanOrEqual(741);
		await page.getByRole('button', { name: 'Inspektor Segmen' }).click();
		await expect(page.getByRole('dialog', { name: 'Inspektor Segmen' })).toBeVisible();
	});

	test('di lebar 800 px palet, indikator, dan inspektor menjadi tab', async ({ page }) => {
		await page.setViewportSize({ width: 800, height: 900 });
		await gotoReady(page, '/lab');
		const tablist = page.getByRole('tablist', { name: 'Panel' });
		await expect(tablist.getByRole('tab')).toHaveCount(3);
		const tools = tablist.getByRole('tab', { name: 'Alat' });
		await expect(tools).toHaveAttribute('aria-selected', 'true');
		await tools.focus();
		await page.keyboard.press('ArrowRight');
		const indicators = tablist.getByRole('tab', { name: 'Indikator' });
		await expect(indicators).toBeFocused();
		await expect(indicators).toHaveAttribute('aria-selected', 'false');
		await page.keyboard.press('Enter');
		await expect(indicators).toHaveAttribute('aria-selected', 'true');
		await expect(
			page.getByRole('tabpanel').getByRole('meter', { name: 'Kualitas Air' })
		).toBeVisible();
		await cell(page, 3, 2).click();
		await expect(page.getByRole('dialog', { name: 'Segmen 3 Tengah, air' })).toBeVisible();
	});

	test('menjalankan 60 bulan mempertahankan rata-rata minimal 30 fps', async ({
		page,
		browserName
	}) => {
		test.skip(browserName !== 'chromium', 'Frame diukur di Chromium saja');
		await gotoReady(page, '/lab');
		await page.getByLabel('Skenario awal').selectOption('kota-padat');
		await cell(page, 1, 1).focus();
		await page.evaluate(() => {
			window.frameGaps = [];
			let last = performance.now();
			const tick = (now: number) => {
				window.frameGaps?.push(now - last);
				last = now;
				requestAnimationFrame(tick);
			};
			requestAnimationFrame(tick);
		});
		for (let i = 0; i < 60; i += 1) await page.keyboard.press('n');
		await expect(page.getByText('Tahun 5, Desember (bulan 60)')).toBeVisible();
		const gaps = await page.evaluate(() => window.frameGaps ?? []);
		const total = gaps.reduce((sum, gap) => sum + gap, 0);
		const fps = (gaps.length / total) * 1000;
		expect(gaps.length).toBeGreaterThan(5);
		expect(fps).toBeGreaterThanOrEqual(30);
		expect(Math.max(...gaps)).toBeLessThan(250);
	});
});
