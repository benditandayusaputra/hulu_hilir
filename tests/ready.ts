import { expect, type Page } from '@playwright/test';

export async function gotoReady(page: Page, route: string): Promise<void> {
	await page.goto(route);
	await expect(page.locator('html')).toHaveAttribute('data-theme', /^(light|dark)$/);
}

export function tabKey(browserName: string): string {
	return browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
}

export async function settleAnimations(page: Page): Promise<void> {
	await page.evaluate(() =>
		Promise.all(document.getAnimations().map((animation) => animation.finished))
	);
}
