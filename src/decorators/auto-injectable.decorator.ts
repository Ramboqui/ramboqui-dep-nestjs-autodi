import { Injectable, InjectableOptions } from '@nestjs/common';

import 'reflect-metadata';

import { AUTO_INJECTABLE_KEY, AUTO_PRIORITY_KEY, AUTO_TOKEN_KEY } from '../constants/di.constants';
import { InterfaceTag } from '../interfaces/interface-tag.interface';

export interface AutoInjectableOptions extends InjectableOptions {
	priority?: number;
	interfaceTag?: InterfaceTag;
}

export function AutoInjectable(options?: AutoInjectableOptions): ClassDecorator {
	return (target: Function) => {
		Injectable(options)(target);
		Reflect.defineMetadata(AUTO_INJECTABLE_KEY, true, target);
		if (options?.interfaceTag) {
			Reflect.defineMetadata(AUTO_TOKEN_KEY, options.interfaceTag, target);
		} else {
			Reflect.defineMetadata(AUTO_TOKEN_KEY, target, target);
		}
		if (options?.priority !== undefined) {
			Reflect.defineMetadata(AUTO_PRIORITY_KEY, options.priority, target);
		}
	};
}
