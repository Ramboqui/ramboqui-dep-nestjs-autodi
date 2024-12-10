/**
 * @internal
 * Global Symbols for DI system.
 */
export const INTERFACE_MAP_KEY = Symbol.for('__INTERFACE_MAP__');
/**
 * @internal
 * Global Symbols for DI system.
 */
export const INTERFACE_TAG = Symbol.for('__INTERFACE_TAG__');
/**
 * @internal
 * Global Symbols for DI system.
 */
export const DESIGN_IMPLEMENTS = Symbol.for('design:implements');

/** @internal Key to mark a class as auto-injectable. */
export const AUTO_INJECTABLE_KEY = Symbol.for('auto:injectable');
/** @internal Key to mark a class as auto-controller. */
export const AUTO_CONTROLLER_KEY = Symbol.for('auto:controller');
/** @internal Key to store the token for an auto-injectable class. */
export const AUTO_TOKEN_KEY = Symbol.for('auto:token');
/** @internal Key to store priority for an auto-injectable class. */
export const AUTO_PRIORITY_KEY = Symbol.for('auto:priority');
