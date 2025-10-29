import { Container as Ioc } from 'inversify';

import type { Module } from '../Module';
import type { Token } from '../Token';

/**
 * Обёртка над контейнером Inversify для декларативной регистрации и разрешения зависимостей.
 *
 * Поддерживает вложенные контейнеры и делегирование к родительскому контейнеру при отсутствии биндинга.
 */
export class Container {
  private readonly ioc: Ioc;

  /**
   * Создаёт экземпляр контейнера с необязательным родительским контейнером.
   *
   * @param parent Родительский контейнер для делегирования разрешения зависимостей.
   */
  constructor(parent?: Container) {
    this.ioc = new Ioc({ parent: parent?.ioc });
  }

  /**
   * Регистрирует фабрику зависимости и настраивает для неё область видимости.
   *
   * @param token Идентификатор зависимости, по которому будет производиться разрешение.
   * @param factory Фабрика, создающая экземпляр зависимости.
   * @param shared Указывает, что зависимость должна быть singleton в рамках контейнера.
   */
  bind<T>(token: Token<T>, factory: () => T, shared?: boolean) {
    const binding = this.ioc.bind<T>(token).toDynamicValue(() => factory());
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
    return this.ioc.get<T>(token);
  }

  /**
   * Пытается вернуть зависимость по идентификатору без выбрасывания исключения при отсутствии биндинга.
   *
   * @param token Идентификатор зависимости, которую требуется получить.
   * @returns Экземпляр зависимости или undefined, если биндинг отсутствует.
   */
  getSafely<T>(token: Token<T>): T | undefined {
    try {
      return this.ioc.get<T>(token);
    } catch {
      return undefined;
    }
  }

  /**
   * Проверяет, зарегистрирована ли зависимость под указанным идентификатором.
   *
   * @param token Идентификатор зависимости для проверки.
   * @returns true, если биндинг существует; иначе false.
   */
  isBound(token: Token<any>): boolean {
    return this.ioc.isBound(token);
  }

  /**
   * Загружает один или несколько модулей в контейнер.
   *
   * @param modules Модули DIEngine.
   */
  load(...modules: Module[]): void {
    this.ioc.loadSync(...modules.map(module => module.loadable));
  }
}
