import 'reflect-metadata';

import { INTERFACE_MAP_KEY, INTERFACE_TAG } from '../constants/di.constants';

export type InterfaceTag = (new (...args: any[]) => any) & {
	readonly tag: symbol;
	readonly interfaceTag: symbol;
};

interface GlobalType {
	[INTERFACE_MAP_KEY]?: Map<symbol, InterfaceTag>;
}

const globalObj = global as unknown as GlobalType;

if (!globalObj[INTERFACE_MAP_KEY]) {
	globalObj[INTERFACE_MAP_KEY] = new Map();
}

const interfaceMap = globalObj[INTERFACE_MAP_KEY]!;

function doesImplement(instance: any, iface: InterfaceTag): boolean {
	const cls = instance?.constructor;
	if (!cls) return false;
	const token = Reflect.getMetadata('auto:token', cls);
	return token === iface;
}

export function createInterface<I>(name: string): InterfaceTag {
	const id = Symbol.for(name);
	const found = interfaceMap.get(id);
	if (found) return found;

	const newInterfaceTag = class {
		static [Symbol.hasInstance](instance: any): boolean {
			return doesImplement(instance, this as unknown as InterfaceTag);
		}

		static get id() {
			return (this as unknown as InterfaceTag).tag;
		}
	};

	Object.defineProperty(newInterfaceTag, 'tag', {
		value: id,
		writable: false,
		configurable: false,
	});

	Object.defineProperty(newInterfaceTag, 'interfaceTag', {
		value: INTERFACE_TAG,
		writable: false,
		configurable: false,
	});

	Object.defineProperty(newInterfaceTag, 'name', {
		value: name,
		writable: false,
		configurable: false,
	});

	Object.freeze(newInterfaceTag);

	const casted = newInterfaceTag as unknown as InterfaceTag;
	interfaceMap.set(id, casted);
	return casted;
}
