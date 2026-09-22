import { defineConfig, devices } from '@playwright/test';

const port = 4174;
const ci = process.env['CI'] === 'true';

export default defineConfig({
	testDir: 'tests/ai-off',
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? 'github' : 'list',
	use: { baseURL: `http://localhost:${port}` },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `pnpm vite dev --port ${port} --strictPort`,
		url: `http://localhost:${port}`,
		reuseExistingServer: !ci,
		stdout: 'ignore',
		env: { PUBLIC_AI_MODE: 'off' }
	}
});
