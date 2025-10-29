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
    it('должен возвращать зависимость через биндинг контейнера', () => {
      const token = Symbol('resolve-basic') as Token<{ call: number }>;

      class ResolveContainer extends Container {
        callCount = 0;

        @provide(token)
        get provided() {
          return { call: ++this.callCount };
        }

        @resolve(token)
        accessor dependency!: { call: number };
      }

      const container = new ResolveContainer();

      const first = container.dependency;
      const second = container.dependency;

      expect(first).not.toBe(second);
      expect(first.call).toBe(1);
      expect(second.call).toBe(2);
    });

    it('должен кешировать значение при включённом cached', () => {
      const token = Symbol('resolve-cached') as Token<number>;

      class CachedContainer extends Container {
        @provide(token)
        get provided() {
          return Math.random();
        }

        @resolve(token, { cached: true })
        accessor cachedDependency!: number;
      }

      const container = new CachedContainer();
      const getSpy = jest.spyOn(container, 'get');

      const first = container.cachedDependency;
      const second = container.cachedDependency;

      expect(first).toBe(second);
      expect(getSpy).toHaveBeenCalledTimes(1);
    });

    it('должен возвращать undefined, если зависимость опциональна и отсутствует', () => {
      const token = Symbol('resolve-optional') as Token<string>;

      class OptionalContainer extends Container {
        @resolve(token, { optional: true })
        accessor maybeDependency!: string | undefined;
      }

      const container = new OptionalContainer();

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
});
