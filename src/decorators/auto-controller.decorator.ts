import { Controller } from '@nestjs/common';

import 'reflect-metadata';

import { AUTO_CONTROLLER_KEY } from '../constants/di.constants';

/**
 * A decorator that marks a class as an auto-controller.
 * Similar to @Controller, but enables automatic registration via @AutoModule.
 * @param prefix Optional route prefix.
 */
export function AutoController(prefix: string | string[]): ClassDecorator {
	return (target: Function) => {
		Controller(prefix)(target);
		Reflect.defineMetadata(AUTO_CONTROLLER_KEY, true, target);
	};
}
