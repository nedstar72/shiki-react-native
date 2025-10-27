import { lazy, lazyFactory } from './index';

describe('lazy', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('должен не вызывать фабрику до первого обращения', () => {
    const factory = jest.fn(() => ({ value: 42 }));

    const value = lazy(factory);

    expect(factory).not.toHaveBeenCalled();

    expect(value.value).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);

    expect(value.value).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('должен создавать независимые ленивые прокси через lazyFactory', () => {
    let seed = 0;
    const factory = jest.fn(() => ({ id: ++seed }));

    const createLazy = lazyFactory(factory);

    const first = createLazy();
    const second = createLazy();

    expect(first).not.toBe(second);
    expect(factory).not.toHaveBeenCalled();

    expect(first.id).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);

    expect(second.id).toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('должен корректно вызывать целевую функцию', () => {
    const callable = jest.fn((a: number, b: number) => a + b);

    const lazyFn = lazy(() => callable);

    expect(callable).not.toHaveBeenCalled();

    expect(lazyFn(2, 3)).toBe(5);
    expect(callable).toHaveBeenCalledTimes(1);
    expect(callable).toHaveBeenCalledWith(2, 3);
  });

  it('должен поддерживать создание экземпляров через new', () => {
    class Example {
      payload: string;

      constructor(payload: string) {
        this.payload = payload;
      }
    }
    const factory = jest.fn(() => Example);

    const LazyExample = lazy(factory);

    expect(factory).not.toHaveBeenCalled();

    const instance = new LazyExample('created');

    expect(instance).toBeInstanceOf(Example);
    expect(instance.payload).toBe('created');
    expect(factory).toHaveBeenCalledTimes(1);
  });
});
