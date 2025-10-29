import { Container } from '../../Container';
import DIEngineError from '../../DIEngineError';
import { Module } from '../../Module';
import type { Token } from '../../Token';

/**
 * Опции конфигурации предоставления зависимости через декоратор.
 */
export interface ProvideOptions {
  shared?: boolean;
}

/**
 * Регистрирует геттер контейнера или модуля как фабрику зависимости.
 *
 * @param token Идентификатор зависимости.
 * @param options Параметры области жизни создаваемой сущности.
 * @returns Декоратор для getter-метода.
 * @throws DIEngineError Если декоратор применён не к getter.
 */
export function provide<T>(token: Token<T>, options?: ProvideOptions) {
  return function provideGetter<Host extends Container | Module>(
    originalGet: (this: Host) => T,
    context: ClassGetterDecoratorContext<Host>,
  ) {
    if (context.kind !== 'getter') {
      throw new DIEngineError(`@provide можно применять только к геттеру`);
    }

    const { shared = false } = options ?? {};

    context.addInitializer(function () {
      if (this instanceof Container) {
        if (!this.isBound(token)) {
          this.bind<T>(token, () => originalGet.call(this), shared);
        }

        return;
      }

      if (this instanceof Module) {
        this.bind<T>(token, () => originalGet.call(this), shared);
      }
    });

    return originalGet;
  };
}
