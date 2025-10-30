import {
  ContainerModule,
  type ContainerModuleLoadOptions,
  type ResolutionContext,
} from 'inversify';

import DIEngineError from '../DIEngineError';
import type { Token } from '../Token';
import { ContextStack } from './ContextStack';

type Registration = (options: ContainerModuleLoadOptions) => void;

export type LoadableModule = ContainerModule;

/**
 * Обертка над ContainerModule из Inversify для декларативного регистрации зависимостей.
 */
export class Module {
  private readonly module: LoadableModule;
  private readonly registrations: Registration[] = [];
  private readonly contextStack = new ContextStack<ResolutionContext>();

  constructor() {
    this.module = new ContainerModule(options => {
      for (const register of this.registrations) {
        register(options);
      }
    });
  }

  /**
   * Объект `LoadableModule`, совместимый с Inversify `load`.
   */
  get loadable(): LoadableModule {
    return this.module;
  }

  /**
   * Регистрирует фабрику зависимости, откладывая фактический биндинг до загрузки модуля.
   *
   * @param token Идентификатор зависимости.
   * @param factory Фабрика, создающая экземпляр зависимости.
   * @param shared Указывает, что зависимость должна быть singleton в рамках контейнера.
   */
  bind<T>(token: Token<T>, factory: () => T, shared?: boolean) {
    this.registrations.push(options => {
      if (options.isBound(token)) {
        throw new DIEngineError(`Токен "${String(token)}" уже зарегистрирован в модуле`);
      }

      const binding = options
        .bind<T>(token)
        .toDynamicValue(ctx => this.contextStack.runWith(ctx, () => factory.call(this)));

      if (shared) {
        binding.inSingletonScope();
      }
    });
  }

  /**
   * Разрешает зависимость через текущий `ResolutionContext`.
   *
   * @param token Идентификатор зависимости.
   * @throws DIEngineError Если метод вызван вне процесса разрешения.
   */
  get<T>(token: Token<T>): T {
    const context = this.contextStack.current;
    if (!context) {
      throw new DIEngineError('Метод Module.get() доступен только при разрешении зависимостей');
    }

    return context.get<T>(token);
  }

  /**
   * Безопасно пытается разрешить зависимость, возвращая undefined при отсутствии зависимости.
   *
   * @param token Идентификатор зависимости.
   */
  getSafely<T>(token: Token<T>): T | undefined {
    try {
      return this.contextStack.current?.get<T>(token);
    } catch {
      return undefined;
    }
  }

  /**
   * Возвращает зависимость из контейнера, к которому привязан модуль.
   *
   * Метод остаётся обёрткой над {@link get}, так как у модуля нет собственного родителя.
   * Добавлен для унификации API с {@link Container} и поддержки декоратора `@resolve`.
   */
  getFromParent<T>(token: Token<T>): T {
    return this.get(token);
  }

  /**
   * Пытается безопасно вернуть зависимость из контейнера, к которому привязан модуль.
   *
   * Обёртка над {@link getSafely} для поддержки декоратора `@resolve`.
   */
  getSafelyFromParent<T>(token: Token<T>): T | undefined {
    return this.getSafely(token);
  }
}
