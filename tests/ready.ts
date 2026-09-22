import { expect, type Page } from '@playwright/test';

export async function gotoReady(page: Page, route: string): Promise<void> {
	await page.goto(route);
	await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
}
