import { Injectable, InjectableOptions } from '@nestjs/common';

import 'reflect-metadata';

import { AUTO_INJECTABLE_KEY, AUTO_PRIORITY_KEY, AUTO_TOKEN_KEY } from '../constants/di.constants';
import { InterfaceMetadata } from '../interfaces/interface-tag.interface';

/**
 * Extended InjectableOptions that supports priority and interfaceTag.
 */
export interface AutoInjectableOptions extends InjectableOptions {
	/**
	 * Priority used to resolve conflicts when multiple classes implement the same interface.
	 * Higher priority wins.
	 */
	priority?: number;
	/**
	 * If provided, the class implements this interface at runtime.
	 * Will be registered as `{ provide: interfaceTag, useClass: class }`.
	 */
	interfaceMetadata?: InterfaceMetadata;
}

/**
 * A decorator that marks a class as auto-injectable, similar to @Injectable,
 * but also can map a class to an interfaceTag and set a priority for conflict resolution.
 * @param options Extended options including priority and interfaceTag.
 */
export function AutoInjectable(options?: AutoInjectableOptions): ClassDecorator {
	return (target: Function) => {
		Injectable(options)(target);
		Reflect.defineMetadata(AUTO_INJECTABLE_KEY, true, target);
		if (options?.interfaceMetadata) {
			Reflect.defineMetadata(AUTO_TOKEN_KEY, options.interfaceMetadata, target);
		} else {
			Reflect.defineMetadata(AUTO_TOKEN_KEY, target, target);
		}
		if (options?.priority !== undefined) {
			Reflect.defineMetadata(AUTO_PRIORITY_KEY, options.priority, target);
		}
	};
}
