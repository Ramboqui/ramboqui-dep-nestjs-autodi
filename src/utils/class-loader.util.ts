import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

/**
 * Loads classes from given glob patterns relative to a base directory.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - If a pattern does not contain '**', we try a direct approach using `fs` to avoid a full glob traversal.
 * - Uses `nodir: true` in glob for complex patterns.
 * - Filters by .ts or .js files.
 * - Before requiring a file, we read its content and check if `@AutoInjectable(` or `@AutoController(` appears.
 *   If not found, we skip `require()`. This drastically reduces overhead if many files don't contain relevant decorators.
 *
 * @param patterns The glob patterns. Example: ["application/services/**\/*.ts"]
 * @param baseDir The base directory, usually the directory of the module that called @AutoModule.
 * @returns An array of classes found.
 */
export function loadClassesFromPatterns(patterns: string[], baseDir: string): Function[] {
	const classes: Function[] = [];

	for (const pattern of patterns) {
		const finalPattern = path.isAbsolute(pattern) ? pattern : path.resolve(baseDir, pattern);

		// If pattern does not contain '**', try simpler approach
		if (!pattern.includes('**')) {
			handleSimplePattern(finalPattern, classes);
		} else {
			handleComplexPattern(finalPattern, classes);
		}
	}

	return classes;
}

/**
 * Handle a simple pattern without '**'.
 * We try to directly read the directory or the file instead of using glob.
 * @param finalPattern The resolved pattern
 * @param classes The array to push found classes
 * @internal
 */
function handleSimplePattern(finalPattern: string, classes: Function[]) {
	const dir = path.dirname(finalPattern);
	const filePattern = path.basename(finalPattern);

	// If filePattern includes '*', it's a simple wildcard in one directory
	if (filePattern.includes('*')) {
		try {
			const files = fs.readdirSync(dir, { withFileTypes: true });
			const fileRegex = new RegExp('^' + filePattern.replace('*', '.*') + '$');
			for (const dirent of files) {
				if (!dirent.isFile()) continue;
				if (!fileRegex.test(dirent.name)) continue;
				const fullPath = path.join(dir, dirent.name);
				loadClassesFromFileIfAnnotated(fullPath, classes);
			}
		} catch {
			// fallback to glob
			loadClassesWithGlob(finalPattern, classes);
		}
	} else {
		// filePattern is a specific file
		if (fs.existsSync(finalPattern) && fs.statSync(finalPattern).isFile()) {
			loadClassesFromFileIfAnnotated(finalPattern, classes);
		} else {
			loadClassesWithGlob(finalPattern, classes);
		}
	}
}

/**
 * Handle complex pattern with '**' using glob.
 * @param finalPattern The pattern
 * @param classes The array to push found classes
 * @internal
 */
function handleComplexPattern(finalPattern: string, classes: Function[]) {
	loadClassesWithGlob(finalPattern, classes);
}

/**
 * Uses glob to load classes, applying nodir: true to reduce overhead.
 * @param pattern The resolved pattern
 * @param classes Reference to classes array
 * @internal
 */
function loadClassesWithGlob(pattern: string, classes: Function[]) {
	const files = glob.sync(pattern, { absolute: true, nodir: true });
	for (const file of files) {
		loadClassesFromFileIfAnnotated(file, classes);
	}
}

/**
 * Checks if a file is a .ts or .js file, reads its content to see if it contains
 * `@AutoInjectable(` or `@AutoController(`. If not found, skip `require()`.
 * If found, require and load classes.
 * @param filePath The file to load from
 * @param classes The array to push found classes
 * @internal
 */
function loadClassesFromFileIfAnnotated(filePath: string, classes: Function[]) {
	if (!isTsOrJs(filePath)) return;

	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		// Check if the file mentions our decorators
		// This is a simple substring check, we assume decorators aren't minified or broken in multiple lines.
		const hasAutoInjectable = content.includes('@AutoInjectable(');
		const hasAutoController = content.includes('@AutoController(');

		if (hasAutoInjectable || hasAutoController) {
			// Only then require the file
			loadClassesFromFile(filePath, classes);
		}
	} catch {
		// Ignore errors, no classes loaded
	}
}

/**
 * Actually requires the file and extracts classes from it.
 * @param filePath The path to the file
 * @param classes The classes array
 * @internal
 */
function loadClassesFromFile(filePath: string, classes: Function[]) {
	const mod = require(filePath);
	for (const exportedName of Object.keys(mod)) {
		const exported = mod[exportedName];
		if (typeof exported === 'function') {
			classes.push(exported);
		}
	}
}

/**
 * Checks if file is .ts or .js
 * @param filePath The file path
 * @returns true if .ts or .js
 * @internal
 */
function isTsOrJs(filePath: string): boolean {
	return filePath.endsWith('.ts') || filePath.endsWith('.js');
}
