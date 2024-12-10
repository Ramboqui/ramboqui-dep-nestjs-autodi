import * as glob from 'glob';
import * as path from 'path';

/**
 * Loads classes from given glob patterns relative to a base directory.
 * @param patterns The glob patterns.
 * @param baseDir The base directory.
 * @returns An array of classes found.
 */
export function loadClassesFromPatterns(patterns: string[], baseDir: string): Function[] {
	const classes: Function[] = [];
	for (const pattern of patterns) {
		const finalPattern = path.isAbsolute(pattern) ? pattern : path.resolve(baseDir, pattern);
		const files = glob.sync(finalPattern, { absolute: true });
		for (const file of files) {
			const mod = require(file);
			for (const exportedName of Object.keys(mod)) {
				const exported = mod[exportedName];
				if (typeof exported === 'function') {
					classes.push(exported);
				}
			}
		}
	}
	return classes;
}
