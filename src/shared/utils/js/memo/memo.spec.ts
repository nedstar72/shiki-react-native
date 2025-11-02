import { memo } from './index';

describe('@memo', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен вычислять значение один раз', () => {
    class Sample {
      calls = 0;

      @memo()
      get expensive() {
        this.calls += 1;
        return { n: Math.random() };
      }
    }

    const s = new Sample();

    const first = s.expensive;
    const second = s.expensive;

    expect(first).toBe(second);
    expect(s.calls).toBe(1);
  });

  it('должен вызывать исходный геттер один раз', () => {
    const getter = jest.fn().mockReturnValue('ok');

    class SpyClass {
      @memo()
      get wrapped() {
        return getter();
      }
    }

    const s = new SpyClass();
    expect(s.wrapped).toBe('ok');
    expect(s.wrapped).toBe('ok');
    expect(getter).toHaveBeenCalledTimes(1);
  });

  it('должен иметь независимый кэш между разными экземплярами', () => {
    class Sample {
      static seq = 0;

      @memo()
      get id() {
        return ++Sample.seq;
      }
    }

    const a = new Sample();
    const b = new Sample();

    expect(a.id).toBe(1);
    expect(a.id).toBe(1);
    expect(b.id).toBe(2);
    expect(b.id).toBe(2);
    expect(Sample.seq).toBe(2);
  });

  it('должен корректно работать со статическим геттером', () => {
    class WithStatic {
      static calls = 0;

      @memo()
      static get one() {
        this.calls += 1;
        return 1;
      }
    }

    const first = WithStatic.one;
    const second = WithStatic.one;

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(WithStatic.calls).toBe(1);
  });

  it('должен не кэшировать ошибку - повторная попытка после ошибки должна снова вызвать геттер', () => {
    let shouldThrow = true;
    let calls = 0;

    class MaybeThrows {
      @memo()
      get value() {
        calls += 1;
        if (shouldThrow) {
          shouldThrow = false;
          throw new Error('boom');
        }
        return 'ready';
      }
    }

    const s = new MaybeThrows();

    expect(() => s.value).toThrow('boom');
    expect(s.value).toBe('ready');
    expect(s.value).toBe('ready');
    expect(calls).toBe(2);
  });

  it('должен работать при наследовании', () => {
    class Base {
      calls = 0;

      @memo()
      get data() {
        this.calls += 1;
        return { v: this.calls };
      }
    }

    class Child extends Base {}

    const c = new Child();
    const first = c.data;
    const second = c.data;

    expect(first).toBe(second);
    expect(c.calls).toBe(1);
  });

  it('должен выбрасывать ошибку, если декоратор применён не к геттеру', () => {
    const decorator = memo();

    const fakeContext = {
      kind: 'method',
      name: 'invalid',
    } as unknown as ClassGetterDecoratorContext<object, unknown>;

    expect(() => decorator(() => undefined as unknown, fakeContext)).toThrow(
      '@memo можно применять только к геттерам',
    );
  });
});
