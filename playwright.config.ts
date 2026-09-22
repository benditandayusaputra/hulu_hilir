import { defineConfig, devices } from '@playwright/test';

const port = 4173;
const mockPort = 4175;
const ci = process.env['CI'] === 'true';

export default defineConfig({
	testDir: 'tests',
	testIgnore: ['**/ai-off/**'],
	fullyParallel: true,
	forbidOnly: ci,
	retries: ci ? 1 : 0,
	reporter: ci ? 'github' : 'list',
	use: { baseURL: `http://localhost:${port}` },
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'firefox', use: { ...devices['Desktop Firefox'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } }
	],
	webServer: [
		{
			command: `pnpm vite dev --port ${port} --strictPort`,
			url: `http://localhost:${port}`,
			reuseExistingServer: !ci,
			stdout: 'ignore',
			env: {
				PUBLIC_AI_MODE: 'server',
				AI_LLM_BASE_URL: `http://127.0.0.1:${mockPort}`,
				AI_LLM_API_KEY: 'uji',
				AI_LLM_MODEL: 'uji'
			}
		},
		{
			command: 'node tests/mock-llm.mjs',
			url: `http://127.0.0.1:${mockPort}/`,
			reuseExistingServer: !ci,
			env: { PORT: String(mockPort) }
		}
	]
});
