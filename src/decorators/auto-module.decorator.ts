import { Module } from '@nestjs/common';
import { ModuleMetadata } from '@nestjs/common/interfaces';

import * as path from 'path';

import { AutoModuleMetadata } from '../interfaces/auto-module-metadata.interface';
import {
	getAutoInjectablePriority,
	getAutoInjectableToken,
	isAutoController,
	isAutoInjectable,
} from '../scanner/scanner';
import { loadClassesFromPatterns } from '../utils/class-loader.util';

/**
 * Get the caller directory by analyzing the stack trace.
 * Skips 'node_modules', 'reflect-metadata', and 'auto-module.decorator.ts'.
 * @returns The directory of the caller module.
 * @internal
 */
function getCallerDir(): string {
	const stack = new Error().stack ?? '';
	const lines = stack.split('\n');

	for (const line of lines) {
		const filePathRegex = /\((.*\.[jt]s):\d+:\d+\)/;
		const match = filePathRegex.exec(line);
		if (match && match[1]) {
			const filePath = match[1];
			if (
				!filePath.includes('node_modules') &&
				!filePath.includes('reflect-metadata') &&
				!filePath.includes('auto-module.decorator.js') &&
				!filePath.includes('auto-module.decorator.ts')
			) {
				return path.dirname(filePath);
			}
		}
	}

	return process.cwd();
}

/**
 * A decorator that replaces @Module(), adding automatic scanning of providers and controllers.
 *
 * If `debug` is true, logs will be printed showing timing, loaded items, and token associations.
 *
 * @param metadata Extended module metadata with providersPath, controllersPath, and debug.
 */
export function AutoModule(metadata: AutoModuleMetadata): ClassDecorator {
	return (target: Function) => {
		const startTime = Date.now();

		const { providersPath, controllersPath, debug, ...rest } = metadata;

		let allProviders: any[] = rest.providers ? [...rest.providers] : [];
		let allControllers: any[] = rest.controllers ? [...rest.controllers] : [];

		const baseDir = getCallerDir();

		if (debug) {
			console.log(`[debug] AutoModule scanning with baseDir: ${baseDir}`);
		}

		const loadedProviders: { token: any; cls: Function; priority: number }[] = [];
		const loadedControllers: Function[] = [];

		if (providersPath && providersPath.length > 0) {
			const providerClasses = loadClassesFromPatterns(providersPath, { baseDir, debug });
			const implMap = new Map<any, { cls: Function; priority: number }[]>();

			for (const cls of providerClasses) {
				if (isAutoInjectable(cls)) {
					const token = getAutoInjectableToken(cls);
					const priority = getAutoInjectablePriority(cls);
					if (!implMap.has(token)) {
						implMap.set(token, []);
					}
					implMap.get(token)!.push({ cls, priority });
				}
			}

			for (const [token, impls] of implMap.entries()) {
				if (impls.length === 1) {
					allProviders.push({ provide: token, useClass: impls[0].cls });
					loadedProviders.push({ token, cls: impls[0].cls, priority: impls[0].priority });
				} else {
					impls.sort((a, b) => b.priority - a.priority);
					if (impls.length > 1 && impls[0].priority === impls[1].priority) {
						throw new Error(
							`Conflict: multiple implementations for token '${token.toString()}' with the same priority.`,
						);
					}
					allProviders.push({ provide: token, useClass: impls[0].cls });
					loadedProviders.push({ token, cls: impls[0].cls, priority: impls[0].priority });
				}
			}
		}

		if (controllersPath && controllersPath.length > 0) {
			const controllerClasses = loadClassesFromPatterns(controllersPath, { baseDir, debug });
			for (const cls of controllerClasses) {
				if (isAutoController(cls)) {
					allControllers.push(cls);
					loadedControllers.push(cls);
				}
			}
		}

		const finalMetadata: ModuleMetadata = {
			...rest,
			providers: allProviders,
			controllers: allControllers,
		};

		Module(finalMetadata)(target);

		if (debug) {
			const endTime = Date.now();
			console.log(`[debug] AutoModule completed scanning in ${endTime - startTime}ms`);
			if (loadedProviders.length > 0) {
				console.log('[debug] Loaded Providers:');
				for (const p of loadedProviders) {
					console.log(` - Token: ${p.token.toString()} -> Class: ${p.cls.name}, Priority: ${p.priority}`);
				}
			} else {
				console.log('[debug] No providers loaded from scanning.');
			}

			if (loadedControllers.length > 0) {
				console.log('[debug] Loaded Controllers:');
				for (const c of loadedControllers) {
					console.log(` - ${c.name}`);
				}
			} else {
				console.log('[debug] No controllers loaded from scanning.');
			}
		}
	};
}
