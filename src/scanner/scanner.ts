import 'reflect-metadata';

import { AUTO_CONTROLLER_KEY, AUTO_INJECTABLE_KEY, AUTO_PRIORITY_KEY, AUTO_TOKEN_KEY } from '../constants/di.constants';

export function isAutoInjectable(cls: Function): boolean {
	return Reflect.getMetadata(AUTO_INJECTABLE_KEY, cls) === true;
}

export function getAutoInjectableToken(cls: Function): any {
	return Reflect.getMetadata(AUTO_TOKEN_KEY, cls);
}

export function getAutoInjectablePriority(cls: Function): number {
	return Reflect.getMetadata(AUTO_PRIORITY_KEY, cls) ?? 0;
}

export function isAutoController(cls: Function): boolean {
	return Reflect.getMetadata(AUTO_CONTROLLER_KEY, cls) === true;
}
