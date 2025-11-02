import { resolve } from './index';
import { Container } from '../../Container';
import DIEngineError from '../../DIEngineError';
import { Module } from '../../Module';
import type { Token } from '../../Token';
import { provide } from '../provide';

describe('@resolve', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Container', () => {
    it('должен возвращать зависимость из родительского контейнера', () => {
      const token = Symbol('resolve-basic') as Token<{ call: number }>;

      class ParentContainer extends Container {
        callCount = 0;

        @provide(token)
        get provided() {
          return { call: ++this.callCount };
        }
      }

      class ResolveContainer extends Container {
        @resolve(token)
        accessor dependency!: { call: number };

        @provide(token)
        get provided() {
          return { call: -1 };
        }
      }

      const parent = new ParentContainer();
      const container = new ResolveContainer(parent);

      const first = container.dependency;
      const second = container.dependency;

      expect(first).not.toBe(second);
      expect(first.call).toBe(1);
      expect(second.call).toBe(2);
      expect(parent.callCount).toBe(2);
    });

    it('должен кешировать значение при включённом cached', () => {
      const token = Symbol('resolve-cached') as Token<number>;

      class ParentContainer extends Container {
        @provide(token)
        get provided() {
          return Math.random();
        }
      }

      class CachedContainer extends Container {
        @resolve(token, { cached: true })
        accessor cachedDependency!: number;
      }

      const parent = new ParentContainer();
      const container = new CachedContainer(parent);
      const getSpy = jest.spyOn(parent, 'get');

      const first = container.cachedDependency;
      const second = container.cachedDependency;

      expect(first).toBe(second);
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('должен возвращать undefined, если зависимость опциональна и отсутствует в родительском контейнере', () => {
      const token = Symbol('resolve-optional') as Token<string>;

      class OptionalParent extends Container {}

      class OptionalContainer extends Container {
        @resolve(token, { optional: true })
        accessor maybeDependency!: string | undefined;
      }

      const container = new OptionalContainer(new OptionalParent());

      expect(container.maybeDependency).toBeUndefined();
    });

    it('должен выбрасывать исключение при отсутствии обязательной зависимости', () => {
      const token = Symbol('resolve-required') as Token<string>;

      class RequiredContainer extends Container {
        @resolve(token)
        accessor requiredDependency!: string;
      }

      const container = new RequiredContainer();

      expect(() => container.requiredDependency).toThrow();
    });

    it('должен запрещать присваивание значения через accessor', () => {
      const token = Symbol('resolve-no-set') as Token<string>;

      class NoSetContainer extends Container {
        @resolve(token, { optional: true })
        accessor dependency!: string | undefined;
      }

      const container = new NoSetContainer();

      expect(() => {
        container.dependency = 'value';
      }).toThrow(DIEngineError);
    });

    it('должен иметь независимый кэш между разными экземплярами', () => {
      const token = Symbol('resolve-cached-per-instance') as Token<{ id: number }>;

      class Parent extends Container {
        call = 0;

        @provide(token)
        get dep() {
          return { id: ++this.call };
        }
      }

      class Child extends Container {
        @resolve(token, { cached: true })
        accessor dep!: { id: number };
      }

      const parent = new Parent();
      const a = new Child(parent);
      const b = new Child(parent);

      const a1 = a.dep;
      const a2 = a.dep;
      const b1 = b.dep;
      const b2 = b.dep;

      // Каждый экземпляр должен получить свой первый вызов
      expect(a1).toBe(a2);
      expect(b1).toBe(b2);
      expect(a1.id).toBe(1);
      expect(b1.id).toBe(2);
    });
  });

  describe('Module', () => {
    it('должен разрешать зависимость через контейнер', () => {
      const dependencyToken = Symbol('module-resolve-basic') as Token<{ call: number }>;
      const serviceToken = Symbol('module-resolve-service') as Token<{ call: number }>;

      class ResolveModule extends Module {
        @resolve(dependencyToken)
        accessor dependency!: { call: number };

        @provide(serviceToken)
        get service() {
          return { call: this.dependency.call };
        }
      }

      let call = 0;

      class DependencyModule extends Module {
        @provide(dependencyToken)
        get dependency() {
          return { call: ++call };
        }
      }

      const module = new ResolveModule();
      const dependencyModule = new DependencyModule();
      const container = new Container();

      container.load(dependencyModule, module);

      const resolved = container.get(serviceToken);

      expect(resolved.call).toBe(1);
      expect(call).toBe(1);
    });

    it('должен кешировать значение при включённом cached', () => {
      const dependencyToken = Symbol('module-resolve-cached-dep') as Token<{ call: number }>;
      const serviceToken = Symbol('module-resolve-cached-service') as Token<{
        first: { call: number };
        second: { call: number };
      }>;

      class CachedModule extends Module {
        @resolve(dependencyToken, { cached: true })
        accessor dependency!: { call: number };

        @provide(serviceToken)
        get service() {
          return {
            first: this.dependency,
            second: this.dependency,
          };
        }
      }

      let call = 0;

      class DependencyModule extends Module {
        @provide(dependencyToken)
        get dependency() {
          return { call: ++call };
        }
      }

      const module = new CachedModule();
      const dependencyModule = new DependencyModule();
      const container = new Container();

      container.load(dependencyModule, module);

      const { first, second } = container.get(serviceToken);

      expect(first).toBe(second);
      expect(call).toBe(1);
    });

    it('должен возвращать undefined для опциональной зависимости при её отсутствии', () => {
      const dependencyToken = Symbol('module-resolve-optional-dep') as Token<string>;
      const serviceToken = Symbol('module-resolve-optional-service') as Token<string | undefined>;

      class OptionalModule extends Module {
        @resolve(dependencyToken, { optional: true })
        accessor maybeDependency!: string | undefined;

        @provide(serviceToken)
        get service() {
          return this.maybeDependency;
        }
      }

      const module = new OptionalModule();

      const container = new Container();
      container.load(module);

      expect(container.get(serviceToken)).toBeUndefined();
    });

    it('должен запрещать присваивание значения через accessor', () => {
      const dependencyToken = Symbol('module-resolve-no-set') as Token<string>;

      class NoSetModule extends Module {
        @resolve(dependencyToken, { optional: true })
        accessor dependency!: string | undefined;
      }

      const module = new NoSetModule();

      expect(() => {
        module.dependency = 'value';
      }).toThrow(DIEngineError);
    });
  });

  it('должен выбрасывать ошибку, если декоратор применён не к accessor', () => {
    const token = Symbol('resolve-invalid') as Token<string>;
    const decorator = resolve(token);
    const fakeContext = {
      kind: 'method',
      name: 'invalid',
      addInitializer: () => {
        throw new Error('initializer must not run');
      },
    } as unknown;

    expect(() =>
      decorator(undefined, fakeContext as ClassAccessorDecoratorContext<Container, string>),
    ).toThrow(Error);
  });

  it('должен иметь независимый кэш между разными экземплярами Module', () => {
    const depToken = Symbol('module-resolve-cached-per-instance-dep') as Token<{ id: number }>;
    const svcToken = Symbol('module-resolve-cached-per-instance-svc') as Token<{
      a: number;
      b: number;
    }>;

    class DepModule extends Module {
      seq = 0;

      @provide(depToken)
      get dep() {
        return { id: ++this.seq };
      }
    }

    class ConsumerA extends Module {
      @resolve(depToken, { cached: true })
      accessor dep!: { id: number };

      @provide(svcToken)
      get svc() {
        return { a: this.dep.id, b: this.dep.id };
      }
    }

    class ConsumerB extends Module {
      @resolve(depToken, { cached: true })
      accessor dep!: { id: number };

      @provide(svcToken)
      get svc() {
        return { a: this.dep.id, b: this.dep.id };
      }
    }

    const container = new Container();
    const dep = new DepModule();
    const a = new ConsumerA();
    const b = new ConsumerB();

    container.load(dep, a);
    const { a: a1, b: a2 } = container.get(svcToken);
    expect(a1).toBe(1);
    expect(a2).toBe(1);

    // Подключаем второй модуль-потребитель отдельно — его кэш не должен "подхватить" значение из A
    const container2 = new Container();
    container2.load(dep, b);
    const { a: b1, b: b2 } = container2.get(svcToken);
    expect(b1).toBe(2);
    expect(b2).toBe(2);
  });
});
