import 'reflect-metadata';

import { INTERFACE_MAP_KEY, INTERFACE_TAG } from '../constants/di.constants';

/**
 * Represents a special runtime interface metadata that can be used as a token and recognized by `instanceof`.
 */
export type InterfaceMetadata = (new (...args: any[]) => any) & {
	readonly tag: symbol;
	readonly interfaceMetadata: symbol;
};

interface GlobalType {
	[INTERFACE_MAP_KEY]?: Map<symbol, InterfaceMetadata>;
}

const globalObj = global as unknown as GlobalType;

if (!globalObj[INTERFACE_MAP_KEY]) {
	globalObj[INTERFACE_MAP_KEY] = new Map();
}

const interfaceMap = globalObj[INTERFACE_MAP_KEY]!;

/**
 * Checks if `instance` implements `iface`.
 * @param instance The instance to check.
 * @param iface The InterfaceMetadata.
 * @returns `true` if `instance` implements `iface`.
 * @internal
 */
function doesImplement(instance: any, iface: InterfaceMetadata): boolean {
	const cls = instance?.constructor;
	if (!cls) return false;
	const token = Reflect.getMetadata('auto:token', cls);
	return token === iface;
}

/**
 * Converts a conceptual interface into a runtime InterfaceMetadata token.
 *
 * This function creates a special InterfaceMetadata for runtime checking and DI tokens.
 * You can then use this InterfaceMetadata as a class type in your constructor to inject implementations
 * without using `@Inject()`.
 *
 * @param name The name of the interface.
 * @returns An InterfaceMetadata that can be used as a token and recognized by `instanceof`.
 */
export function convertInterface<I>(name: string): InterfaceMetadata {
	const id = Symbol.for(name);
	const found = interfaceMap.get(id);
	if (found) return found;

	const newInterfaceMetadata = class {
		static [Symbol.hasInstance](instance: any): boolean {
			return doesImplement(instance, this as unknown as InterfaceMetadata);
		}

		static get id() {
			return (this as unknown as InterfaceMetadata).tag;
		}
	};

	Object.defineProperty(newInterfaceMetadata, 'tag', {
		value: id,
		writable: false,
		configurable: false,
	});

	Object.defineProperty(newInterfaceMetadata, 'interfaceMetadata', {
		value: INTERFACE_TAG,
		writable: false,
		configurable: false,
	});

	Object.defineProperty(newInterfaceMetadata, 'name', {
		value: name,
		writable: false,
		configurable: false,
	});

	Object.freeze(newInterfaceMetadata);

	const casted = newInterfaceMetadata as unknown as InterfaceMetadata;
	interfaceMap.set(id, casted);
	return casted;
}
