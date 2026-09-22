import vercel from '@sveltejs/adapter-vercel';
import staticAdapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

const buildsStaticOnly = process.env['BUILD_TARGET'] === 'static';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: buildsStaticOnly ? staticAdapter({ strict: false }) : vercel()
		})
	],
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			include: ['src/lib/sim/**'],
			exclude: ['src/lib/sim/**/*.test.ts'],
			thresholds: { lines: 90 }
		}
	}
});
