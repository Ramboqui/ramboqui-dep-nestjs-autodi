/**
 * @module @ramboqui/nestjs-autodi
 *
 * This library provides decorators for automatic dependency injection and module configuration.
 * - `@AutoInjectable(options)` extends `@Injectable`, allowing `interfaceTag` and `priority`.
 * - `@AutoController(prefix?)` extends `@Controller`.
 * - `@AutoModule({ providersPath, controllersPath, ... })` scans and registers classes automatically.
 * - `createInterface<I>(name)` creates an `InterfaceTag` for runtime interface checks and DI tokens.
 */

export * from './decorators/auto-controller.decorator';
export * from './decorators/auto-injectable.decorator';
export * from './decorators/auto-module.decorator';
export * from './interfaces/auto-module-metadata.interface';
export * from './interfaces/interface-tag.interface';
