import 'reflect-metadata';

import { INTERFACE_MAP_KEY, INTERFACE_TAG } from '../constants/di.constants';

/**
 * Represents a special runtime interface tag that can be used as a token and recognized by `instanceof`.
 */
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

/**
 * Checks if `instance` implements `iface`.
 * @param instance The instance to check.
 * @param iface The InterfaceTag.
 * @returns true if `instance` implements `iface`.
 * @internal
 */
function doesImplement(instance: any, iface: InterfaceTag): boolean {
	const cls = instance?.constructor;
	if (!cls) return false;
	const token = Reflect.getMetadata('auto:token', cls);
	return token === iface;
}

/**
 * Creates a special InterfaceTag for runtime checking and DI tokens.
 * @param name The name of the interface.
 * @returns An InterfaceTag that can be used as a token and recognized by `instanceof`.
 */
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
