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
 * Scans the specified patterns for classes. If a class has @AutoInjectable, it becomes a provider.
 * If a class has @AutoController, it becomes a controller.
 *
 * For classes that implement an interfaceTag (set in @AutoInjectable),
 * they are registered with `{ provide: interfaceTag, useClass: ... }`.
 *
 * If multiple classes implement the same interfaceTag, the one with higher priority wins.
 * In a tie, an error is thrown.
 *
 * This enables injecting the implementation by simply using the InterfaceTag as the parameter type,
 * without needing @Inject().
 *
 * @param metadata Extended module metadata with providersPath and controllersPath.
 */
export function AutoModule(metadata: AutoModuleMetadata): ClassDecorator {
	return (target: Function) => {
		const { providersPath, controllersPath, ...rest } = metadata;

		let allProviders: any[] = rest.providers ? [...rest.providers] : [];
		let allControllers: any[] = rest.controllers ? [...rest.controllers] : [];

		const baseDir = getCallerDir();

		if (providersPath && providersPath.length > 0) {
			const providerClasses = loadClassesFromPatterns(providersPath, baseDir);
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
				} else {
					impls.sort((a, b) => b.priority - a.priority);
					if (impls.length > 1 && impls[0].priority === impls[1].priority) {
						throw new Error(
							`Conflict: multiple implementations for token '${token.toString()}' with the same priority.`,
						);
					}
					allProviders.push({ provide: token, useClass: impls[0].cls });
				}
			}
		}

		if (controllersPath && controllersPath.length > 0) {
			const controllerClasses = loadClassesFromPatterns(controllersPath, baseDir);
			for (const cls of controllerClasses) {
				if (isAutoController(cls)) {
					allControllers.push(cls);
				}
			}
		}

		const finalMetadata: ModuleMetadata = {
			...rest,
			providers: allProviders,
			controllers: allControllers,
		};

		Module(finalMetadata)(target);
	};
}
