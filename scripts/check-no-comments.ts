import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseHtml, type DefaultTreeAdapterMap } from 'parse5';
import postcss from 'postcss';
import { parse as parseSvelte } from 'svelte/compiler';
import ts from 'typescript';
import { Lexer as YamlLexer } from 'yaml';

export interface Violation {
	file: string;
	line: number;
	column: number;
	snippet: string;
}

interface Found {
	offset: number;
	text: string;
}

type HtmlNode = DefaultTreeAdapterMap['node'];

const scriptExtensions = new Set(['.ts', '.mts', '.cts', '.js', '.mjs', '.cjs']);
const markupExtensions = new Set(['.html', '.svg']);
const yamlExtensions = new Set(['.yml', '.yaml']);
const yamlControlTokens = new Set(['\u0002', '\u0018', '\u001f']);
const shebangPrefix = '#!';
const snippetLimit = 80;

function positionAt(source: string, offset: number): { line: number; column: number } {
	const before = source.slice(0, offset);
	return { line: before.split('\n').length, column: offset - before.lastIndexOf('\n') };
}

function scanScript(source: string, baseOffset: number, kind: ts.ScriptKind): Found[] {
	const sourceFile = ts.createSourceFile('input', source, ts.ScriptTarget.Latest, true, kind);
	const seen = new Set<number>();
	const found: Found[] = [];
	const collect = (ranges: ts.CommentRange[] | undefined) => {
		for (const range of ranges ?? []) {
			if (seen.has(range.pos)) continue;
			seen.add(range.pos);
			found.push({ offset: baseOffset + range.pos, text: source.slice(range.pos, range.end) });
		}
	};
	const visit = (node: ts.Node) => {
		collect(ts.getLeadingCommentRanges(source, node.getFullStart()));
		collect(ts.getTrailingCommentRanges(source, node.getEnd()));
		for (const child of node.getChildren(sourceFile)) visit(child);
	};
	visit(sourceFile);
	return found.sort((left, right) => left.offset - right.offset);
}

function scanCss(source: string, baseOffset: number): Found[] {
	const found: Found[] = [];
	postcss.parse(source).walkComments((comment) => {
		const start = comment.source?.start?.offset;
		const end = comment.source?.end?.offset;
		if (start === undefined || end === undefined) return;
		found.push({ offset: baseOffset + start, text: source.slice(start, end + 1) });
	});
	return found;
}

function offsetsOf(node: object): { start: number; end: number } | null {
	const record: Record<string, unknown> = { ...node };
	const start = record['start'];
	const end = record['end'];
	return typeof start === 'number' && typeof end === 'number' ? { start, end } : null;
}

function walkTemplate(node: unknown, source: string, found: Found[], seen: WeakSet<object>): void {
	if (Array.isArray(node)) {
		for (const child of node) walkTemplate(child, source, found, seen);
		return;
	}
	if (typeof node !== 'object' || node === null || seen.has(node)) return;
	seen.add(node);
	const record: Record<string, unknown> = { ...node };
	const start = record['start'];
	const end = record['end'];
	if (record['type'] === 'Comment' && typeof start === 'number' && typeof end === 'number') {
		found.push({ offset: start, text: source.slice(start, end) });
		return;
	}
	for (const value of Object.values(record)) walkTemplate(value, source, found, seen);
}

function scanSvelte(source: string): Found[] {
	const ast = parseSvelte(source, { modern: true });
	const found: Found[] = [];
	walkTemplate(ast.fragment, source, found, new WeakSet());
	for (const script of [ast.instance, ast.module]) {
		if (!script) continue;
		const range = offsetsOf(script.content);
		if (range === null) continue;
		found.push(...scanScript(source.slice(range.start, range.end), range.start, ts.ScriptKind.TS));
	}
	if (ast.css) {
		const { start, styles } = ast.css.content;
		found.push(...scanCss(styles, start));
	}
	return found.sort((left, right) => left.offset - right.offset);
}

function walkHtml(node: HtmlNode, found: Found[]): void {
	if (node.nodeName === '#comment' && 'data' in node) {
		const location = node.sourceCodeLocation;
		if (location) found.push({ offset: location.startOffset, text: `<!--${node.data}-->` });
		return;
	}
	if ('content' in node) walkHtml(node.content, found);
	if ('childNodes' in node) for (const child of node.childNodes) walkHtml(child, found);
}

function scanHtml(source: string): Found[] {
	const found: Found[] = [];
	walkHtml(parseHtml(source, { sourceCodeLocationInfo: true }), found);
	return found;
}

function scanYaml(source: string): Found[] {
	const found: Found[] = [];
	let offset = 0;
	for (const token of new YamlLexer().lex(source)) {
		if (yamlControlTokens.has(token)) continue;
		if (token.startsWith('#')) found.push({ offset, text: token });
		offset += token.length;
	}
	return found;
}

function scanHashLines(source: string): Found[] {
	const found: Found[] = [];
	let offset = 0;
	source.split('\n').forEach((line, index) => {
		const isShebang = index === 0 && line.startsWith(shebangPrefix);
		if (line.trimStart().startsWith('#') && !isShebang) {
			found.push({ offset: offset + line.indexOf('#'), text: line.trim() });
		}
		offset += line.length + 1;
	});
	return found;
}

function scanByKind(file: string, source: string): Found[] | null {
	const extension = path.extname(file);
	const base = path.basename(file);
	if (scriptExtensions.has(extension)) return scanScript(source, 0, ts.ScriptKind.TS);
	if (base === 'tsconfig.json') return scanScript(source, 0, ts.ScriptKind.JSON);
	if (extension === '.svelte') return scanSvelte(source);
	if (extension === '.css') return scanCss(source, 0);
	if (markupExtensions.has(extension)) return scanHtml(source);
	if (yamlExtensions.has(extension)) return scanYaml(source);
	if (extension === '.sh' || base === '.env.example' || source.startsWith(shebangPrefix)) {
		return scanHashLines(source);
	}
	return null;
}

export function findComments(file: string, source: string): Violation[] {
	const found = scanByKind(file, source) ?? [];
	return found.map(({ offset, text }) => {
		const { line, column } = positionAt(source, offset);
		const firstLine = text.split('\n')[0] ?? '';
		const snippet =
			firstLine.length > snippetLimit ? `${firstLine.slice(0, snippetLimit)}...` : firstLine;
		return { file, line, column, snippet };
	});
}

export function listProjectFiles(root: string): string[] {
	const output = execFileSync(
		'git',
		['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
		{ cwd: root, encoding: 'utf8' }
	);
	return output.split('\0').filter((file) => file !== '');
}

export function checkProject(root: string): Violation[] {
	const violations: Violation[] = [];
	for (const file of listProjectFiles(root)) {
		let source: string;
		try {
			source = readFileSync(path.join(root, file), 'utf8');
		} catch {
			continue;
		}
		violations.push(...findComments(file, source));
	}
	return violations;
}

const invokedDirectly =
	process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
	const violations = checkProject(process.cwd());
	for (const violation of violations) {
		process.stderr.write(
			`${violation.file}:${violation.line}:${violation.column}: ${violation.snippet}\n`
		);
	}
	if (violations.length > 0) {
		process.stderr.write(`Ditemukan ${violations.length} komentar.\n`);
		process.exit(1);
	}
	process.stdout.write('Tidak ada komentar.\n');
}
