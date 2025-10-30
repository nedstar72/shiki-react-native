import { Container } from '../../Container';
import DIEngineError from '../../DIEngineError';
import { Module } from '../../Module';
import type { Token } from '../../Token';

/**
 * Опции конфигурации разрешения зависимостей через декоратор.
 */
export interface ResolveOptions {
  optional?: boolean;
  cached?: boolean;
}

/**
 * Связывает accessor контейнера или модуля с разрешением зависимости из контейнера или модуля.
 *
 * @param token Идентификатор зависимости.
 * @param options Параметры поведения доступа к зависимости.
 * @returns Декоратор для TS5 auto-accesor.
 * @throws DIEngineError Если декоратор применён не к accessor или Container/Module.
 */
export function resolve<T, Options extends ResolveOptions>(token: Token<T>, options?: Options) {
  type Result = Options extends { optional: true } ? T | undefined : T;

  return function resolveAccessor<Host extends Container | Module>(
    _unused: unknown,
    context: ClassAccessorDecoratorContext<Host, Result>,
  ) {
    if (context.kind !== 'accessor') {
      throw new DIEngineError(`@resolve можно применять только к accessor`);
    }

    const { name } = context;
    const { optional = false, cached = false } = options ?? {};

    let hasCache = false;
    let cachedValue: T | undefined;

    context.addInitializer(function () {
      if (!(this instanceof Container) && !(this instanceof Module)) {
        throw new DIEngineError(`@resolve можно применять только к Container или Module`);
      }

      Object.defineProperty(this, name, {
        configurable: false,
        enumerable: true,
        get: function (): Result {
          if (cached && hasCache) {
            return cachedValue as Result;
          }

          const currentHost = this as Container | Module;
          const value = optional
            ? currentHost.getSafelyFromParent<T>(token)
            : currentHost.getFromParent<T>(token);

          if (cached) {
            hasCache = true;
            cachedValue = value;
          }

          return value as Result;
        },
        set: function (_: Result) {
          throw new DIEngineError(
            `Нельзя присваивать значение в @resolve-аксессор "${String(name)}"`,
          );
        },
      });
    });
  };
}
