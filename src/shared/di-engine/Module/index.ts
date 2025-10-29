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
 * Описывает декларативный модуль DI, загружаемый в Inversify-контейнер.
 *
 * В отличие от контейнера, откладывает регистрацию биндингов до момента загрузки.
 * При разрешении зависимостей поддерживает доступ к текущему `ResolutionContext`.
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
   * @param factory Фабрика значения, выполняемая внутри активного `ResolutionContext`.
   * @param shared Определяет, должен ли биндинг быть singleton.
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
   * Разрешает зависимость через контейнер, связанный с текущим `ResolutionContext`.
   *
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
   * Безопасно пытается разрешить зависимость, возвращая undefined при отсутствии биндинга.
   */
  getSafely<T>(token: Token<T>): T | undefined {
    const context = this.contextStack.current;
    if (!context) {
      return undefined;
    }

    return context.get<T>(token, { optional: true });
  }
}
