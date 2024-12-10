import { Controller } from '@nestjs/common';

import 'reflect-metadata';

import { AUTO_CONTROLLER_KEY } from '../constants/di.constants';

export function AutoController(prefix: string | string[]): ClassDecorator {
	return (target: Function) => {
		Controller(prefix)(target);
		Reflect.defineMetadata(AUTO_CONTROLLER_KEY, true, target);
	};
}
