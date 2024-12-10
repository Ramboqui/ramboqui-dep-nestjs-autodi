# @ramboqui/nestjs-autodi

This library provides decorators and utilities for automatic dependency injection and module configuration in NestJS, inspired by [@lido-nestjs/di](https://www.npmjs.com/package/@lido-nestjs/di) and [@tiny-nestjs/auto-injectable](https://www.npmjs.com/package/@tiny-nestjs/auto-injectable). It simplifies the process of wiring up providers and controllers without the need for manual declarations, and allows injecting implementations of interfaces without resorting to `@Inject()` in most cases.

## Features

- **Automatic Scanning of Providers and Controllers:**  
  The `@AutoModule()` decorator scans specified paths for classes annotated with `@AutoInjectable()` and `@AutoController()` and registers them automatically.
  
- **Runtime Interface Metadata Tokens:**  
  Use `convertInterface` to convert an interface into a runtime token (`InterfaceMetadata`) that can be used as a DI token, and recognized by `instanceof`.
  
- **Priority-Based Conflict Resolution:**  
  If multiple classes implement the same interface token, the one with the highest `priority` (set in `@AutoInjectable` options) is chosen. A tie results in an error.
  
- **No Manual `@Inject()` Needed for Interfaces:**  
  By using the `InterfaceMetadata` directly as a type in the constructor parameter, you can get the appropriate implementation injected automatically.
  
- **Preserves Original NestJS Metadata:**  
  `@AutoInjectable()` calls `@Injectable()` internally, `@AutoController()` calls `@Controller()` internally, ensuring all original NestJS metadata is retained.

## Requirements

- Node.js environment
- NestJS v10 or higher
- `reflect-metadata`
- TypeScript

## Installation

```bash
npm install @ramboqui/nestjs-autodi
```

You must have `@nestjs/common`, `@nestjs/core`, and `reflect-metadata` installed as peer dependencies.

## Usage

### Defining Interfaces

Use `convertInterface` to create an `InterfaceMetadata` that can be used as a token at runtime.

```typescript
import { convertInterface } from '@ramboqui/nestjs-autodi';

export interface ICatalogoServicePort {
  listarItens(): string[];
}

export const ICatalogoServicePortMeta = convertInterface<ICatalogoServicePort>('ICatalogoServicePort');
```

### Implementing Classes

Use `@AutoInjectable({ interfaceMetadata: ..., priority: ... })` to mark a class as a provider. If `interfaceMetadata` is provided, the class will be registered as `{ provide: interfaceMetadata, useClass: ... }`.

```typescript
import { AutoInjectable } from '@ramboqui/nestjs-autodi';
import { ICatalogoServicePortMeta, ICatalogoServicePort } from '../interfaces/catalogo.interface';

@AutoInjectable({ interfaceMetadata: ICatalogoServicePortMeta, priority: 10 })
export class CatalogoService implements ICatalogoServicePort {
  listarItens(): string[] {
    return ['item1', 'item2'];
  }
}
```

If multiple classes implement `ICatalogoServicePortMeta`, the one with higher priority wins.

### Auto Controllers

Use `@AutoController()` to mark a class as a controller without declaring it manually in the module.

```typescript
import { AutoController } from '@ramboqui/nestjs-autodi';
import { Get } from '@nestjs/common';
import { ICatalogoServicePortMeta } from '../interfaces/catalogo.interface';

@AutoController('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: ICatalogoServicePortMeta) {}

  @Get()
  listar() {
    return this.catalogoService.listarItens();
  }
}
```

Notice that the `catalogoService` parameter uses `ICatalogoServicePortMeta` directly as a type. No `@Inject()` is required because the library registers `{ provide: ICatalogoServicePortMeta, useClass: CatalogoService }` automatically.

### Auto Module

Replace `@Module()` with `@AutoModule()` to automatically load providers and controllers from specified paths.

```typescript
import { AutoModule } from '@ramboqui/nestjs-autodi';

@AutoModule({
  providersPath: ['application/services/**/*.ts'],
  controllersPath: ['infrastructure/controllers/**/*.ts']
})
export class AppModule {}
```

This will scan the specified patterns relative to the module's directory, find classes with `@AutoInjectable()` and `@AutoController()`, and register them automatically.

## Project Structure

A possible project structure integrating this library:

```text
src/
  application/
    services/
      catalogo.service.ts
  infrastructure/
    controllers/
      catalogo.controller.ts
  interfaces/
    catalogo.interface.ts
  app.module.ts
```

## Debugging and Running

- Works with `ts-node` or after compilation.
- No extra config needed besides installing peer dependencies and using decorators.

## Publishing the Library

This library builds TypeScript into JavaScript before publishing. To publish the build only:

1. Add a `.npmignore` file excluding `src`, `tsconfig.json`, etc.
2. Run:
   ```bash
   npm run build
   npm publish --access public
   ```

Only the `dist` folder and allowed files will be published.

## Credits

- Inspired by ideas from [@lido-nestjs/di](URL_HERE) and [@tiny-nestjs/auto-injectable](URL_HERE).

## License

MIT License.
