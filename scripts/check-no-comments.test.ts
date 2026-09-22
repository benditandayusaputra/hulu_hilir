import { describe, expect, it } from 'vitest';
import { findComments } from './check-no-comments';

describe('pemeriksa komentar pada TypeScript', () => {
	it('mengabaikan URL di dalam string', () => {
		const source =
			'const docs = \'https://svelte.dev/docs/kit\';\nconst api = "http://localhost//x";\n';
		expect(findComments('a.ts', source)).toEqual([]);
	});

	it('mengabaikan garis miring ganda di dalam regex', () => {
		const source =
			'const protocolless = /^\\/\\//;\nconst tail = /ab\\//;\nconst both = /[/]{2}/;\n';
		expect(findComments('a.ts', source)).toEqual([]);
	});

	it('mengabaikan template literal', () => {
		const source =
			'const base = "x";\nconst t = `// bukan komentar ${base} /* juga bukan */ https://a.b//c`;\n';
		expect(findComments('a.ts', source)).toEqual([]);
	});

	it('menemukan komentar satu baris beserta posisinya', () => {
		const source = 'const a = 1; // catatan\nconst b = 2;\n';
		expect(findComments('a.ts', source)).toEqual([
			{ file: 'a.ts', line: 1, column: 14, snippet: '// catatan' }
		]);
	});

	it('menemukan komentar banyak baris dan JSDoc', () => {
		const source = '/**\n * Dok\n */\nexport const a = 1;\n/* blok */\n';
		const lines = findComments('a.ts', source).map((violation) => violation.line);
		expect(lines).toEqual([1, 5]);
	});

	it('menemukan komentar di akhir berkas tanpa token setelahnya', () => {
		const source = 'export const a = 1;\n// akhir\n';
		expect(findComments('a.ts', source)).toHaveLength(1);
	});

	it('mengabaikan shebang tetapi menemukan komentar di skrip node', () => {
		const source = '#!/usr/bin/env node\nconst a = 1; // x\n';
		expect(findComments('bin.js', source)).toHaveLength(1);
	});

	it('memeriksa tsconfig.json sebagai JSON berkomentar', () => {
		const source = '{\n\t"compilerOptions": {\n\t\t// strict\n\t\t"strict": true\n\t}\n}\n';
		expect(findComments('tsconfig.json', source)).toHaveLength(1);
	});
});

describe('pemeriksa komentar pada CSS', () => {
	it('mengabaikan url() dengan garis miring', () => {
		const source =
			"@import 'tailwindcss';\na { background: url(https://cdn.example/a//b.png); }\nb { background: url('//cdn.example/c.svg'); }\n";
		expect(findComments('a.css', source)).toEqual([]);
	});

	it('menemukan komentar blok', () => {
		const source = 'a { color: red; }\n/* warna */\nb { color: blue; }\n';
		expect(findComments('a.css', source)).toEqual([
			{ file: 'a.css', line: 2, column: 1, snippet: '/* warna */' }
		]);
	});
});

describe('pemeriksa komentar pada Svelte', () => {
	const clean =
		'<script lang="ts">\n\tconst url = \'https://example.com//x\';\n\tconst re = /\\/\\//;\n</script>\n\n<a href={url}>{`// ${url}`}</a>\n\n<style>\n\ta { background: url(https://cdn.example/a//b.png); }\n</style>\n';

	it('mengabaikan jebakan di skrip, templat, dan gaya', () => {
		expect(findComments('A.svelte', clean)).toEqual([]);
	});

	it('menemukan komentar HTML di templat termasuk yang bersarang', () => {
		const source = '<!-- luar -->\n<div>\n\t{#if true}<!-- dalam -->x{/if}\n</div>\n';
		const lines = findComments('A.svelte', source).map((violation) => violation.line);
		expect(lines).toEqual([1, 3]);
	});

	it('menemukan komentar di dalam script dengan nomor baris berkas', () => {
		const source = '<div></div>\n\n<script lang="ts">\n\tconst a = 1; // x\n</script>\n';
		expect(findComments('A.svelte', source)).toEqual([
			{ file: 'A.svelte', line: 4, column: 15, snippet: '// x' }
		]);
	});

	it('menemukan komentar di dalam style', () => {
		const source = '<div></div>\n\n<style>\n\t/* gaya */\n\tdiv { color: red; }\n</style>\n';
		expect(findComments('A.svelte', source)).toEqual([
			{ file: 'A.svelte', line: 4, column: 2, snippet: '/* gaya */' }
		]);
	});
});

describe('pemeriksa komentar pada HTML dan SVG', () => {
	it('menemukan komentar di HTML', () => {
		const source = '<!doctype html>\n<html lang="id">\n<body>\n<!-- isi -->\n</body>\n</html>\n';
		expect(findComments('app.html', source)).toEqual([
			{ file: 'app.html', line: 4, column: 1, snippet: '<!-- isi -->' }
		]);
	});

	it('menemukan komentar editor di SVG dan mengabaikan URL atribut', () => {
		const source =
			'<svg xmlns="http://www.w3.org/2000/svg"><!-- Generator: editor --><path d="M0 0"/></svg>\n';
		expect(findComments('icon.svg', source)).toHaveLength(1);
		expect(findComments('icon.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>\n')).toEqual([]);
	});
});

describe('pemeriksa komentar pada YAML', () => {
	it('mengabaikan pagar di dalam string dan skalar blok', () => {
		const source = 'url: "http://x/#frag"\nrun: |\n  echo "# bukan komentar"\ntitle: \'a #b\'\n';
		expect(findComments('ci.yml', source)).toEqual([]);
	});

	it('menemukan komentar baris penuh dan komentar ekor', () => {
		const source = 'name: CI # ekor\n# baris penuh\non: push\n';
		expect(findComments('ci.yml', source)).toEqual([
			{ file: 'ci.yml', line: 1, column: 10, snippet: '# ekor' },
			{ file: 'ci.yml', line: 2, column: 1, snippet: '# baris penuh' }
		]);
	});
});

describe('pemeriksa komentar pada shell dan .env.example', () => {
	it('mengabaikan shebang tetapi menemukan baris pagar', () => {
		const source = '#!/bin/sh\nset -e\n# catatan\necho "# bukan"\n';
		expect(findComments('.githooks/hook', source)).toEqual([
			{ file: '.githooks/hook', line: 3, column: 1, snippet: '# catatan' }
		]);
	});

	it('menemukan komentar di .env.example', () => {
		expect(findComments('.env.example', 'PUBLIC_AI_MODE=off\n# rahasia\n')).toHaveLength(1);
	});

	it('mengabaikan jenis berkas yang tidak dikenal', () => {
		expect(findComments('README.md', '# Judul\n')).toEqual([]);
	});
});
