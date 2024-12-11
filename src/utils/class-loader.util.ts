import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

interface LoadClassesOptions {
	baseDir: string;
	debug?: boolean;
}

/**
 * In-memory cache to avoid reading the same file multiple times.
 * Key: filePath, Value: content string or null if failed to read.
 * @internal
 */
const fileContentCache = new Map<string, string | null>();

/**
 * Loads classes from given glob patterns relative to a base directory.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - If a pattern does not contain '**', try a direct approach using `fs` to avoid a full glob traversal.
 * - Uses `nodir: true` in glob for complex patterns.
 * - Filters by .ts or .js files.
 * - Before requiring a file, read its content and check if it contains
 *   `@AutoInjectable(` or `@AutoController(`. If not found, skip `require()`.
 * - Cache file reads to avoid reading the same file multiple times.
 *
 * @param patterns The glob patterns. Example: ["application/services/**\/*.ts"]
 * @param options An object containing baseDir and debug flag.
 * @returns An array of classes found.
 */
export function loadClassesFromPatterns(patterns: string[], options: LoadClassesOptions): Function[] {
	const classes: Function[] = [];
	const { baseDir, debug } = options;

	for (const pattern of patterns) {
		const finalPattern = path.isAbsolute(pattern) ? pattern : path.resolve(baseDir, pattern);

		if (!pattern.includes('**')) {
			handleSimplePattern(finalPattern, classes, debug);
		} else {
			handleComplexPattern(finalPattern, classes, debug);
		}
	}

	return classes;
}

/**
 * Handle a simple pattern without '**'.
 * @internal
 */
function handleSimplePattern(finalPattern: string, classes: Function[], debug?: boolean) {
	const dir = path.dirname(finalPattern);
	const filePattern = path.basename(finalPattern);

	if (filePattern.includes('*')) {
		try {
			const files = fs.readdirSync(dir, { withFileTypes: true });
			const fileRegex = new RegExp('^' + filePattern.replace('*', '.*') + '$');
			for (const dirent of files) {
				if (!dirent.isFile()) continue;
				if (!fileRegex.test(dirent.name)) continue;
				const fullPath = path.join(dir, dirent.name);
				loadClassesFromFileIfAnnotated(fullPath, classes, debug);
			}
		} catch {
			loadClassesWithGlob(finalPattern, classes, debug);
		}
	} else {
		if (fs.existsSync(finalPattern) && fs.statSync(finalPattern).isFile()) {
			loadClassesFromFileIfAnnotated(finalPattern, classes, debug);
		} else {
			loadClassesWithGlob(finalPattern, classes, debug);
		}
	}
}

/**
 * Handle complex pattern with '**' using glob.
 * @internal
 */
function handleComplexPattern(finalPattern: string, classes: Function[], debug?: boolean) {
	loadClassesWithGlob(finalPattern, classes, debug);
}

/**
 * Uses glob to load classes, applying nodir: true to reduce overhead.
 * @internal
 */
function loadClassesWithGlob(pattern: string, classes: Function[], debug?: boolean) {
	const files = glob.sync(pattern, { absolute: true, nodir: true });
	for (const file of files) {
		loadClassesFromFileIfAnnotated(file, classes, debug);
	}
}

/**
 * Checks if a file is a .ts or .js file, reads its content (with cache) to see if it contains
 * `@AutoInjectable(` or `@AutoController(`. If not found, skip `require()`.
 * If found, require and load classes.
 * @internal
 */
function loadClassesFromFileIfAnnotated(filePath: string, classes: Function[], debug?: boolean) {
	if (!isTsOrJs(filePath)) return;

	const content = getFileContent(filePath);
	if (!content) return;

	const hasAutoInjectable = content.includes('@AutoInjectable(');
	const hasAutoController = content.includes('@AutoController(');

	if (hasAutoInjectable || hasAutoController) {
		loadClassesFromFile(filePath, classes, debug);
	}
}

/**
 * Actually requires the file and extracts classes from it.
 * @internal
 */
function loadClassesFromFile(filePath: string, classes: Function[], debug?: boolean) {
	const mod = require(filePath);
	for (const exportedName of Object.keys(mod)) {
		const exported = mod[exportedName];
		if (typeof exported === 'function') {
			classes.push(exported);
		}
	}
	if (debug) {
		console.log(`[debug] Loaded classes from: ${filePath}`);
	}
}

/**
 * Checks if file is .ts or .js
 * @internal
 */
function isTsOrJs(filePath: string): boolean {
	return filePath.endsWith('.ts') || filePath.endsWith('.js');
}

/**
 * Get file content from cache or read from disk.
 * @internal
 */
function getFileContent(filePath: string): string | null {
	if (fileContentCache.has(filePath)) {
		return fileContentCache.get(filePath)!;
	}
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		fileContentCache.set(filePath, content);
		return content;
	} catch {
		fileContentCache.set(filePath, null);
		return null;
	}
}
