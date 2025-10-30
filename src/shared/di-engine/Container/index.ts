import { Container as InversifyContainer } from 'inversify';

import DIEngineError from '../DIEngineError';
import type { Module } from '../Module';
import type { Token } from '../Token';

/**
 * Обёртка над контейнером Inversify для декларативной регистрации и разрешения зависимостей.
 *
 * Поддерживает вложенные контейнеры и делегирование к родительскому контейнеру при отсутствии локальной зависимости.
 */
export class Container {
  private readonly parent?: Container;
  private readonly inversifyContainer: InversifyContainer;

  /**
   * Создаёт экземпляр контейнера с необязательным родительским контейнером.
   *
   * @param parent Родительский контейнер для делегирования разрешения зависимостей.
   */
  constructor(parent?: Container) {
    this.parent = parent;
    this.inversifyContainer = new InversifyContainer({ parent: parent?.inversifyContainer });
  }

  /**
   * Регистрирует фабрику зависимости и настраивает для неё область видимости.
   *
   * @param token Идентификатор зависимости, по которому будет производиться разрешение.
   * @param factory Фабрика, создающая экземпляр зависимости.
   * @param shared Указывает, что зависимость должна быть singleton в рамках контейнера.
   */
  bind<T>(token: Token<T>, factory: () => T, shared?: boolean) {
    const binding = this.inversifyContainer.bind<T>(token).toDynamicValue(() => factory());
    if (shared) {
      binding.inSingletonScope();
    }
  }

  /**
   * Возвращает зарегистрированную зависимость по идентификатору.
   *
   * @param token Идентификатор зарегистрированной зависимости.
   * @returns Экземпляр зависимости, созданный соответствующей фабрикой.
   * @throws Error Если зависимость с указанным идентификатором не зарегистрирована.
   */
  get<T>(token: Token<T>): T {
    return this.inversifyContainer.get<T>(token);
  }

  /**
   * Пытается вернуть зависимость по идентификатору без выбрасывания исключения при отсутствии.
   *
   * @param token Идентификатор зависимости, которую требуется получить.
   * @returns Экземпляр зависимости или undefined, если зависимость отсутствует.
   */
  getSafely<T>(token: Token<T>): T | undefined {
    try {
      return this.inversifyContainer.get<T>(token);
    } catch {
      return undefined;
    }
  }

  /**
   * Разрешает зависимость только через родительский контейнер.
   *
   * @param token Идентификатор зависимости.
   * @throws DIEngineError Если родительский контейнер отсутствует.
   */
  getFromParent<T>(token: Token<T>): T {
    if (!this.parent) {
      throw new DIEngineError(
        `Родительский контейнер отсутствует: невозможно получить "${String(token)}"`,
      );
    }

    return this.parent.get<T>(token);
  }

  /**
   * Пытается разрешить зависимость только через родительский контейнер.
   *
   * @param token Идентификатор зависимости.
   * @returns Экземпляр зависимости или undefined, если родительский контейнер отсутствует.
   */
  getSafelyFromParent<T>(token: Token<T>): T | undefined {
    return this.parent?.getSafely<T>(token);
  }

  /**
   * Проверяет, зарегистрирована ли зависимость под указанным идентификатором.
   *
   * @param token Идентификатор зависимости для проверки.
   * @returns true, если зависимость существует, иначе false.
   */
  isBound(token: Token<any>): boolean {
    return this.inversifyContainer.isBound(token);
  }

  /**
   * Загружает один и более модулей в контейнер.
   *
   * @param modules Список модулей для загрузки.
   */
  load(...modules: Module[]): void {
    this.inversifyContainer.loadSync(...modules.map(module => module.loadable));
  }
}
