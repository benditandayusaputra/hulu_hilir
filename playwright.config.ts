import { defineConfig, devices } from '@playwright/test';

const port = 4173;

export default defineConfig({
	testDir: 'tests',
	fullyParallel: true,
	forbidOnly: process.env['CI'] === 'true',
	retries: process.env['CI'] === 'true' ? 1 : 0,
	reporter: process.env['CI'] === 'true' ? 'github' : 'list',
	use: { baseURL: `http://localhost:${port}` },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
	],
	webServer: {
		command: `pnpm vite dev --port ${port} --strictPort`,
		url: `http://localhost:${port}`,
		reuseExistingServer: process.env['CI'] !== 'true',
		stdout: 'ignore'
	}
});
