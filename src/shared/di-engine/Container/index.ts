import { Container as Ioc } from 'inversify';

/**
 * Универсальный идентификатор зависимости, поддерживающий строки, символы и классы.
 */
export type Identifier<T> = string | symbol | Constructor<T> | AbstractConstructor<T>;

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
   * @param id Идентификатор зависимости, по которому будет производиться разрешение.
   * @param factory Фабрика, создающая экземпляр зависимости.
   * @param shared Указывает, что зависимость должна быть singleton в рамках контейнера.
   */
  bind<T>(id: Identifier<T>, factory: () => T, shared?: boolean) {
    const binding = this.ioc.bind<T>(id).toDynamicValue(() => factory());
    if (shared) {
      binding.inSingletonScope();
    }
  }

  /**
   * Возвращает зарегистрированную зависимость по идентификатору.
   *
   * @param id Идентификатор зарегистрированной зависимости.
   * @returns Экземпляр зависимости, созданный соответствующей фабрикой.
   * @throws Error Если зависимость с указанным идентификатором не зарегистрирована.
   */
  get<T>(id: Identifier<T>): T {
    return this.ioc.get<T>(id);
  }

  /**
   * Пытается вернуть зависимость по идентификатору без выбрасывания исключения при отсутствии биндинга.
   *
   * @param id Идентификатор зависимости, которую требуется получить.
   * @returns Экземпляр зависимости или undefined, если биндинг отсутствует.
   */
  getSafely<T>(id: Identifier<T>): T | undefined {
    try {
      return this.ioc.get<T>(id);
    } catch {
      return undefined;
    }
  }

  /**
   * Проверяет, зарегистрирована ли зависимость под указанным идентификатором.
   *
   * @param id Идентификатор зависимости для проверки.
   * @returns true, если биндинг существует; иначе false.
   */
  isBound(id: Identifier<any>): boolean {
    return this.ioc.isBound(id);
  }
}
