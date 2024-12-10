import 'reflect-metadata';

import { AUTO_CONTROLLER_KEY, AUTO_INJECTABLE_KEY, AUTO_PRIORITY_KEY, AUTO_TOKEN_KEY } from '../constants/di.constants';

/**
 * Checks if a class is auto-injectable.
 * @internal
 */
export function isAutoInjectable(cls: Function): boolean {
	return Reflect.getMetadata(AUTO_INJECTABLE_KEY, cls) === true;
}

/**
 * Gets the token (class or InterfaceTag) of an auto-injectable class.
 * @internal
 */
export function getAutoInjectableToken(cls: Function): any {
	return Reflect.getMetadata(AUTO_TOKEN_KEY, cls);
}

/**
 * Gets the priority of an auto-injectable class.
 * @internal
 */
export function getAutoInjectablePriority(cls: Function): number {
	return Reflect.getMetadata(AUTO_PRIORITY_KEY, cls) ?? 0;
}

/**
 * Checks if a class is an auto-controller.
 * @internal
 */
export function isAutoController(cls: Function): boolean {
	return Reflect.getMetadata(AUTO_CONTROLLER_KEY, cls) === true;
}
