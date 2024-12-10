import * as glob from 'glob';
import * as path from 'path';

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
