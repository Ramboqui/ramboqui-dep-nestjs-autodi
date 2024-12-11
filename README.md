# @ramboqui/nestjs-autodi

This library provides decorators and utilities for NestJS to enable automatic discovery and registration of providers and controllers, as well as a simpler way to handle interfaces at runtime. It is inspired by [@lido-nestjs/di](https://www.npmjs.com/package/@lido-nestjs/di) and [@tiny-nestjs/auto-injectable](https://www.npmjs.com/package/@tiny-nestjs/auto-injectable).

By using this library, you reduce boilerplate, avoid manual listing of providers and controllers in your modules, and you can even inject implementations of interfaces without having to use `@Inject()` decorators. This makes your code cleaner, more maintainable, and easier to scale.

## Why Use This Library Instead of Pure NestJS?

In NestJS, you typically have to:

- Manually declare providers and controllers in your `@Module()`.
- Use `@Inject()` when injecting by tokens, especially for interfaces that don't exist at runtime.
- Update your modules each time you add or remove a provider or controller.

With `@ramboqui/nestjs-autodi`:

- **Automatic Scanning:** `@AutoModule()` scans your directories for classes annotated with `@AutoInjectable()` and `@AutoController()`, registering them without manual edits.
- **Interface Metadata Tokens:** You can convert interfaces into runtime tokens and inject them just like classes, without `@Inject()`.
- **Priority-Based Implementation Selection:** If multiple classes implement the same interface, assign a `priority` to pick the best one automatically.
- **Preserves Metadata:** It still calls the original `@Injectable()` and `@Controller()` internally, ensuring full compatibility with NestJS features.

In short, you write less repetitive code, rely more on conventions, and simplify the handling of interfaces and their implementations.

## Core Concepts

### 1. Converting Interfaces to Runtime Tokens

Normally, TypeScript interfaces do not exist at runtime. This library introduces `convertInterface<I>(name)` to create a runtime token called `InterfaceMetadata`. This token can be used by NestJS DI just like a class.

**Why do this?** Because with a runtime token, you can inject implementations by simply referencing the interface token as a parameter type in the constructor, without `@Inject()`.

**Example:**

```typescript
import { convertInterface } from '@ramboqui/nestjs-autodi';

export interface ICatalogoServicePort {
  listarItens(): string[];
}

// Convert the interface into a runtime token
export const ICatalogoServicePort = convertInterface<ICatalogoServicePort>('ICatalogoServicePort');
```

Now `ICatalogoServicePort` is a runtime token you can use for DI.

### 2. AutoInjectable Classes

The `@AutoInjectable(options?)` decorator has two main functions:

1. **Automatic Provider Registration:**  
   If you annotate a class with `@AutoInjectable()` (even without `interfaceMetadata`), that class is automatically considered a NestJS provider. When you use `@AutoModule()` (explained later), the class will be discovered and registered as a provider without you manually listing it. You can then inject this class into your constructors by just referencing it as a parameter type.

2. **Interface Implementation Declaration (Optional):**  
   If you provide `interfaceMetadata` (the token obtained from `convertInterface`) in `@AutoInjectable({ interfaceMetadata: ... })`, you are telling NestJS that this class is an implementation of that interface. This means that when you attempt to inject by the interface token, NestJS will supply this class. If multiple classes implement the same interface, you can set a `priority` to choose the best implementation. No `@Inject()` is needed if your parameter type is the `InterfaceMetadata` token.

**Example:**

```typescript
import { AutoInjectable } from '@ramboqui/nestjs-autodi';
import { ICatalogoServicePort } from '../interfaces/catalogo.interface';

@AutoInjectable({ interfaceMetadata: ICatalogoServicePort, priority: 10 })
export class CatalogoService implements ICatalogoServicePort {
  listarItens(): string[] {
    return ['item1', 'item2'];
  }
}
```

Here, `CatalogoService` is both automatically registerable as a provider and associated with `ICatalogoServicePort`. If you have multiple implementations of `ICatalogoServicePort`, `priority` decides which one wins.

If you don't provide `interfaceMetadata`, the class is still auto-discovered as a provider, but won't serve as an implementation of a runtime interface token. You can still inject it by its own class type.

### 3. Auto Controllers

The `@AutoController(prefix?)` decorator works like `@Controller()`, but classes annotated this way are also automatically discovered. This means no more manual listing of controllers in your modules.

**Example:**

```typescript
import { AutoController } from '@ramboqui/nestjs-autodi';
import { Get } from '@nestjs/common';
import { ICatalogoServicePort } from '../interfaces/catalogo.interface';

@AutoController('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: ICatalogoServicePort) {}

  @Get()
  listar() {
    return this.catalogoService.listarItens();
  }
}
```

Because `ICatalogoServicePort` is a runtime token (from `convertInterface`), and `CatalogoService` is registered via `@AutoInjectable`, you get the correct implementation injected without `@Inject()`.

### 4. Auto Module

`@AutoModule({ providersPath, controllersPath, ... })` replaces `@Module()` and scans the specified paths for classes with `@AutoInjectable()` and `@AutoController()`. It uses the call stack to determine the directory of the calling module, ensuring relative paths work even after build.

**Example:**

```typescript
import { AutoModule } from '@ramboqui/nestjs-autodi';

@AutoModule({
  providersPath: ['application/services/**/*.ts'],
  controllersPath: ['infrastructure/controllers/**/*.ts'],
})
export class AppModule {}
```

This will automatically register all discovered providers and controllers. No manual edits needed.

## How It All Ties Together

1. Convert your interface into a token with `convertInterface`.
2. Annotate your classes with `@AutoInjectable()`. If you specify `interfaceMetadata`, that class becomes the implementation of the interface token.
3. Annotate your controllers with `@AutoController()`.
4. Use `@AutoModule()` in your module, specifying where to find providers and controllers.
5. NestJS will automatically discover and register them, and you can inject classes or interfaces without `@Inject()`.

## Example Scenario

```typescript
// interfaces/catalogo.interface.ts
import { convertInterface } from '@ramboqui/nestjs-autodi';

export interface ICatalogoServicePort {
  listarItens(): string[];
}
export const ICatalogoServicePort = convertInterface<ICatalogoServicePort>('ICatalogoServicePort');

// application/services/catalogo.service.ts
import { AutoInjectable } from '@ramboqui/nestjs-autodi';
import { ICatalogoServicePort } from '../interfaces/catalogo.interface';

@AutoInjectable({ interfaceMetadata: ICatalogoServicePort, priority: 10 })
export class CatalogoService implements ICatalogoServicePort {
  listarItens(): string[] {
    return ['item1', 'item2'];
  }
}

// infrastructure/controllers/catalogo.controller.ts
import { AutoController } from '@ramboqui/nestjs-autodi';
import { Get } from '@nestjs/common';
import { ICatalogoServicePort } from '../interfaces/catalogo.interface';

@AutoController('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: ICatalogoServicePort) {}

  @Get()
  listar() {
    return this.catalogoService.listarItens();
  }
}

// app.module.ts
import { AutoModule } from '@ramboqui/nestjs-autodi';

@AutoModule({
  providersPath: ['application/services/**/*.ts'],
  controllersPath: ['infrastructure/controllers/**/*.ts']
})
export class AppModule {}
```

No manual listing of the `CatalogoService` or `CatalogoController` is needed. `ICatalogoServicePort` is recognized at runtime, and `CatalogoService` is chosen automatically.

## Credits

Inspired by:  
- [@lido-nestjs/di](https://www.npmjs.com/package/@lido-nestjs/di)  
- [@tiny-nestjs/auto-injectable](https://www.npmjs.com/package/@tiny-nestjs/auto-injectable)

## License

MIT License
