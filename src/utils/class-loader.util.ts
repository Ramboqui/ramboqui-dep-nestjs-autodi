import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';

/**
 * Loads classes from given glob patterns relative to a base directory.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - If a pattern does not contain '**', we try a more direct approach using `fs` to avoid a full glob traversal.
 * - If pattern seems to point to a single directory or a specific file, we list that directory directly.
 * - Use `nodir: true` in glob for complex patterns to reduce overhead.
 * - Filter out non-.ts and non-.js files before requiring to minimize unnecessary requires.
 *
 * @param patterns The glob patterns. Example: ["application/services/**\/*.ts"]
 * @param baseDir The base directory, usually the directory of the module that called @AutoModule.
 * @returns An array of classes found.
 */
export function loadClassesFromPatterns(patterns: string[], baseDir: string): Function[] {
	const classes: Function[] = [];

	for (const pattern of patterns) {
		const finalPattern = path.isAbsolute(pattern) ? pattern : path.resolve(baseDir, pattern);

		if (!pattern.includes('**')) {
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
						loadClassesFromFile(fullPath, classes);
					}
				} catch {
					loadClassesWithGlob(finalPattern, classes);
				}
			} else {
				if (fs.existsSync(finalPattern) && fs.statSync(finalPattern).isFile()) {
					loadClassesFromFile(finalPattern, classes);
				} else {
					loadClassesWithGlob(finalPattern, classes);
				}
			}
		} else {
			loadClassesWithGlob(finalPattern, classes);
		}
	}

	return classes;
}

/**
 * Loads classes from a single file, filtering out non-function exports.
 * Also filters by extension (.ts or .js) to reduce unnecessary requires.
 *
 * @param filePath The absolute path to the file
 * @param classes Reference to the classes array to be filled
 * @internal
 */
function loadClassesFromFile(filePath: string, classes: Function[]): void {
	if (!filePath.endsWith('.ts') && !filePath.endsWith('.js')) {
		return;
	}

	const mod = require(filePath);
	for (const exportedName of Object.keys(mod)) {
		const exported = mod[exportedName];
		if (typeof exported === 'function') {
			classes.push(exported);
		}
	}
}

/**
 * Uses glob to load classes, applying nodir: true to reduce overhead.
 *
 * @param pattern The resolved pattern
 * @param classes Reference to classes array
 * @internal
 */
function loadClassesWithGlob(pattern: string, classes: Function[]): void {
	const files = glob.sync(pattern, { absolute: true, nodir: true });
	for (const file of files) {
		loadClassesFromFile(file, classes);
	}
}
