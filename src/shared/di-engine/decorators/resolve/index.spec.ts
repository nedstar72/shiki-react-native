import { Container, type Identifier } from '../../Container';
import DIEngineError from '../../DIEngineError';
import { provide } from '../provide';
import { resolve } from './index';

describe('@resolve', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен возвращать зависимость через биндинг контейнера', () => {
    const token = Symbol('resolve-basic') as Identifier<{ call: number }>;

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
    const token = Symbol('resolve-cached') as Identifier<number>;

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
    const token = Symbol('resolve-optional') as Identifier<string>;

    class OptionalContainer extends Container {
      @resolve(token, { optional: true })
      accessor maybeDependency!: string | undefined;
    }

    const container = new OptionalContainer();

    expect(container.maybeDependency).toBeUndefined();
  });

  it('должен выбрасывать исключение при отсутствии обязательной зависимости', () => {
    const token = Symbol('resolve-required') as Identifier<string>;

    class RequiredContainer extends Container {
      @resolve(token)
      accessor requiredDependency!: string;
    }

    const container = new RequiredContainer();

    expect(() => container.requiredDependency).toThrow();
  });

  it('должен запрещать присваивание значения через accessor', () => {
    const token = Symbol('resolve-no-set') as Identifier<string>;

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
    const token = Symbol('resolve-invalid') as Identifier<string>;
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
