import type { Identifier, Container } from '../../Container';
import DIEngineError from '../../DIEngineError';

/**
 * Опции конфигурации разрешения зависимостей через декоратор.
 *
 * Позволяют настроить опциональность и кеширование результата.
 */
export interface ResolveOptions {
  optional?: boolean;
  cached?: boolean;
}

/**
 * Связывает accessor контейнера с разрешением зависимости из DI.
 *
 * @param id Идентификатор зависимости для разрешения.
 * @param options Параметры поведения доступа к зависимости.
 * @returns Декоратор для TS5 auto-accessor.
 * @throws Error Если декоратор применён не к accessor.
 */
export function resolve<T, Options extends ResolveOptions>(id: Identifier<T>, options?: Options) {
  type Result = Options extends { optional: true } ? T | undefined : T;

  return function resolveAccessor<C extends Container>(
    _unused: unknown,
    context: ClassAccessorDecoratorContext<C, Result>,
  ) {
    if (context.kind !== 'accessor') {
      throw new Error(`@resolve можно применять только к accessor`);
    }

    const { name } = context;
    const { optional = false, cached = false } = options ?? {};

    let hasCache = false;
    let cachedValue: T | undefined;

    context.addInitializer(function () {
      Object.defineProperty(this, name, {
        configurable: false,
        enumerable: true,
        get: function (): Result {
          if (cached && hasCache) {
            return cachedValue as Result;
          }

          const value = optional ? (this as C).getSafely<T>(id) : (this as C).get<T>(id);

          if (cached) {
            hasCache = true;
            cachedValue = value;
          }

          return value as Result;
        },
        set: function (_: Result) {
          throw new DIEngineError(
            `Нельзя присваивать значение в @resolve accessor "${String(name)}"`,
          );
        },
      });
    });

    return;
  };
}
