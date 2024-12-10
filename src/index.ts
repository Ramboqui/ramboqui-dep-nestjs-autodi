/**
 * @module @ramboqui/nestjs-autodi
 *
 * This library provides decorators for automatic dependency injection and module configuration in NestJS.
 *
 * Features:
 * - `@AutoInjectable(options)`: Extends `@Injectable`, supporting `interfaceMetadata` and `priority`.
 * - `@AutoController(prefix?)`: Extends `@Controller`, enabling automatic controller registration.
 * - `@AutoModule({ providersPath, controllersPath, ... })`: Scans the specified paths for classes annotated with
 *   `@AutoInjectable` and `@AutoController` and registers them automatically without manual declarations.
 * - `convertInterface<I>(name)`: Converts a conceptual interface into a runtime InterfaceMetadata, serving as a token
 *   and allowing injection by simply using it as a type in the constructor parameter (no `@Inject()` needed).
 *
 * Example Use Case:
 * 
 * ```typescript
 * // interfaces/catalogo.interface.ts
 * import { convertInterface } from '@ramboqui/nestjs-autodi';
 *
 * export interface ICatalogoServicePort {
 *   listarItens(): string[];
 * }
 *
 * export const ICatalogoServicePortMeta = convertInterface<ICatalogoServicePort>('ICatalogoServicePort');
 *
 * // application/services/catalogo.service.ts
 * import { AutoInjectable } from '@ramboqui/nestjs-autodi';
 * import { ICatalogoServicePortMeta, ICatalogoServicePort } from '../interfaces/catalogo.interface';
 *
 * @AutoInjectable({ interfaceMetadata: ICatalogoServicePortMeta, priority: 10 })
 * export class CatalogoService implements ICatalogoServicePort {
 *   listarItens(): string[] {
 *     return ['item1', 'item2'];
 *   }
 * }
 *
 * // infrastructure/controllers/catalogo.controller.ts
 * import { AutoController } from '@ramboqui/nestjs-autodi';
 * import { Get } from '@nestjs/common';
 * import { ICatalogoServicePortMeta } from '../interfaces/catalogo.interface';
 *
 * @AutoController('catalogo')
 * export class CatalogoController {
 *   constructor(private readonly catalogoService: ICatalogoServicePortMeta) {}
 *
 *   @Get()
 *   listar() {
 *     return this.catalogoService.listarItens();
 *   }
 * }
 *
 * // app.module.ts
 * import { AutoModule } from '@ramboqui/nestjs-autodi';
 *
 * @AutoModule({
 *   providersPath: ['application/services/**\/*.ts'],
 *   controllersPath: ['infrastructure/controllers/**\/*.ts']
 * })
 * export class AppModule {}
 * ```
 *
 * Requirements:
 * - Node.js environment
 * - NestJS v10 or higher
 * - TypeScript
 * - `reflect-metadata`
 */

export * from './decorators/auto-controller.decorator';
export * from './decorators/auto-injectable.decorator';
export * from './decorators/auto-module.decorator';
export * from './interfaces/auto-module-metadata.interface';
export * from './interfaces/interface-metadata.interface';
