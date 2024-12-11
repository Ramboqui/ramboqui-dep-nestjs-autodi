# @ramboqui/nestjs-autodi

This library provides decorators and utilities for NestJS to enable automatic discovery and registration of providers and controllers, as well as simpler handling of interfaces at runtime. It was inspired by [@lido-nestjs/di](https://www.npmjs.com/package/@lido-nestjs/di) and [@tiny-nestjs/auto-injectable](https://www.npmjs.com/package/@tiny-nestjs/auto-injectable).

By using this library, you reduce boilerplate, avoid manually listing providers and controllers, and can even inject implementations of interfaces without `@Inject()`.

## Why This Library?

**Without this library:**

-   You manually list every provider and controller in your `@Module()`.
-   To inject an interface, you often need `@Inject()` and manual token management.
-   Adding or removing providers or controllers requires editing the module.

**With this library:**

-   `@AutoModule()` scans directories and registers classes annotated with `@AutoInjectable()` and `@AutoController()`.
-   `convertInterface()` transforms an interface into a runtime token (`InterfaceMetadata`), allowing direct injection by using it as a constructor parameter type.
-   Multiple implementations of the same interface? Use `priority` to pick the best one automatically.
-   No extra `@Inject()` needed in most cases.

## Concepts

### Converting Interfaces into Runtime Tokens

**Function:** `convertInterface<I>(name)`

Interfaces vanish at runtime. `convertInterface` creates an `InterfaceMetadata` that serves as a runtime token. You can then use this token as a type in your constructor parameter and NestJS will inject the corresponding implementation.

```typescript
import { convertInterface } from '@ramboqui/nestjs-autodi';

export interface ICatalogoServicePort {
listarItens(): string[];
}

export const ICatalogoServicePort = convertInterface<ICatalogoServicePort>('ICatalogoServicePort');
```

### AutoInjectable Classes

**Decorator:** `@AutoInjectable(options?)`

`@AutoInjectable` does two things:

1. **Automatic Provider Registration:**  
   Even without `interfaceMetadata`, annotating a class with `@AutoInjectable()` makes it discoverable as a provider. When using `@AutoModule()`, this class will be found and registered without manual listing.

2. **Interface Implementation (optional):**  
   If you set `interfaceMetadata` in `@AutoInjectable({ interfaceMetadata: ... })`, the class is registered as `{ provide: interfaceMetadata, useClass: ... }`. This allows injecting the interface just by using the interface token type. If multiple classes provide the same interface token, `priority` decides which one wins.

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

Without `interfaceMetadata`, `CatalogoService` would still be discovered as a provider (no manual listing), but just not associated with an interface token.

### Auto Controllers

**Decorator:** `@AutoController(prefix?)`

`@AutoController` works like `@Controller` but allows automatic discovery by `@AutoModule`. No need to add controllers manually to `Module`.

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

Here, `catalogoService` uses `ICatalogoServicePort` (an interface token) as its type. No `@Inject()` required.

### Auto Module

**Decorator:** `@AutoModule(metadata)`

`@AutoModule()` replaces `@Module()` and scans `providersPath` and `controllersPath` for classes marked `@AutoInjectable()` and `@AutoController()`. It uses the call stack to find the caller directory, ensuring your patterns work even after building to `dist`.

```typescript
import { AutoModule } from '@ramboqui/nestjs-autodi';

@AutoModule({
providersPath: ['application/services/**/*.ts'],
controllersPath: ['infrastructure/controllers/**/*.ts'],
})
export class AppModule {}
```

This automatically registers all discovered providers and controllers.

### Performance Considerations

This version includes optimizations to `loadClassesFromPatterns`:

-   If a pattern doesn't contain `**`, it tries a direct approach using `fs` to avoid heavy `glob` operations.
-   Uses `nodir: true` and filters by `.ts` or `.js` extensions to reduce unnecessary `require()` calls.
-   By refining patterns or using more specific glob patterns, you can further reduce startup time.

## Example

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

No manual listing required. `ICatalogoServicePort` is a runtime token, so `CatalogoService` is injected by just using `ICatalogoServicePort` as the constructor parameter type.

## Credits

-   Inspired by [@lido-nestjs/di](https://www.npmjs.com/package/@lido-nestjs/di) and [@tiny-nestjs/auto-injectable](https://www.npmjs.com/package/@tiny-nestjs/auto-injectable).

## License

MIT License
