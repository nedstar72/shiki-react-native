import type { Container, Identifier } from '../../Container';
import DIEngineError from '../../DIEngineError';

/**
 * Опции конфигурации предоставления зависимости через декоратор.
 */
export interface ProvideOptions {
  shared?: boolean;
}

/**
 * Регистрирует getter контейнера как фабрику зависимости.
 *
 * @param id Идентификатор, под которым будет доступна зависимость.
 * @param options Параметры области жизни создаваемой сущности.
 * @returns Декоратор для getter-метода контейнера.
 * @throws DIEngineError Если декоратор применён не к getter.
 */
export function provide<T>(id: Identifier<T>, options?: ProvideOptions) {
  return function provideGetter<C extends Container>(
    originalGet: (this: C) => T,
    context: ClassGetterDecoratorContext<C>,
  ) {
    if (context.kind !== 'getter') {
      throw new DIEngineError(`@provide можно применять только к getter`);
    }

    const { shared = false } = options ?? {};

    context.addInitializer(function () {
      // this — экземпляр контейнера; регистрируем фабрику,
      // которая вызовет оригинальный getter на текущем экземпляре.
      // Для shared берём инверсайвовский singleton scope.
      // Важно: биндим только если ещё не забиндено (чтобы позволить оверрайды в parent).
      if (!(this as C).isBound(id)) {
        (this as C).bind<T>(id, () => originalGet.call(this), shared);
      }
    });

    // Геттер поведение не меняем, возвращаем исходный.
    return originalGet;
  };
}
