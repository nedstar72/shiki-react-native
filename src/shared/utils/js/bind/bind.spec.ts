import { bind } from './index';

describe('@bind', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен вызывать метод с корректным this при отрыве ссылки', () => {
    class A {
      value = 42;

      @bind()
      getValue() {
        return this.value;
      }
    }

    const a = new A();
    const fn = a.getValue;
    expect(fn()).toBe(42);
  });

  it('должен класть связанную функцию как own-свойство экземпляра и возвращать ту же ссылку', () => {
    class A {
      @bind()
      m() {
        return 1;
      }
    }

    const a = new A();

    const desc = Object.getOwnPropertyDescriptor(a, 'm');
    expect(desc).toBeDefined();

    const f1 = a.m;
    const f2 = a.m;
    expect(f1).toBe(f2);
  });

  it('должен иметь независимые bound-функции для разных экземпляров', () => {
    class C {
      id: number;
      constructor(id: number) {
        this.id = id;
      }

      @bind()
      getId() {
        return this.id;
      }
    }

    const a = new C(1);
    const b = new C(2);

    const fa = a.getId;
    const fb = b.getId;

    expect(fa()).toBe(1);
    expect(fb()).toBe(2);
    expect(fa).not.toBe(fb);
  });

  it('должен работать при наследовании', () => {
    class Base {
      n = 10;

      @bind()
      inc(x: number) {
        return this.n + x;
      }
    }

    class Child extends Base {
      n = 100;
    }

    const c = new Child();
    const f = c.inc;
    expect(f(23)).toBe(123);
  });

  it('должен не перезаписывать уже существующее own-свойство', () => {
    class A {
      // заранее кладём какое-то значение
      // @ts-expect-error
      m = () => 'pre-set';

      // eslint-disable-next-line @typescript-eslint/no-dupe-class-members
      @bind()
      // @ts-expect-error
      m(_: never): never {
        throw new Error('не должен вызываться');
      }
    }

    const a = new A();
    expect(a.m()).toBe('pre-set');
  });

  it('должен выбрасывать ошибку, если применён не к методу', () => {
    const decorator = bind();

    const fakeContext = {
      kind: 'getter',
      name: 'invalid',
      static: false,
      private: false,
      addInitializer() {
        /* noop */
      },
    } as unknown as ClassMethodDecoratorContext<object, any>;

    expect(() =>
      decorator(function () {
        /* noop */
      }, fakeContext),
    ).toThrow('@bind можно применять только к методам');
  });

  it('должен выбрасывать ошибку при декорировании статического метода', () => {
    expect(() => {
      class A {
        @bind()
        static m() {
          return 1;
        }
      }

      return A;
    }).toThrow('@bind не поддерживает статические методы');
  });
});
