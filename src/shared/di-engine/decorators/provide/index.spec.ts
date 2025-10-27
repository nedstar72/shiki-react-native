import { provide } from './index';
import { Container, type Identifier } from '../../Container';
import DIEngineError from '../../DIEngineError';

describe('@provide', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('должен регистрировать геттер как transient-фабрику по умолчанию', () => {
    const token = Symbol('provide-transient') as Identifier<{ call: number }>;

    class TransientContainer extends Container {
      callCount = 0;

      @provide(token)
      get dependency() {
        return { call: ++this.callCount };
      }
    }

    const container = new TransientContainer();

    const first = container.get(token);
    const second = container.get(token);

    expect(first).not.toBe(second);
    expect(first.call).toBe(1);
    expect(second.call).toBe(2);
  });

  it('должен поддерживать регистрацию singleton при shared: true', () => {
    const token = Symbol('provide-shared') as Identifier<{ call: number }>;

    class SharedContainer extends Container {
      callCount = 0;

      @provide(token, { shared: true })
      get singleton() {
        return { call: ++this.callCount };
      }
    }

    const container = new SharedContainer();

    const first = container.get(token);
    const second = container.get(token);

    expect(first).toBe(second);
    expect(first.call).toBe(1);
  });

  it('должен пропускать регистрацию, если зависимость уже есть в родителе', () => {
    const token = Symbol('provide-parent') as Identifier<string>;

    class ChildContainer extends Container {
      callCount = 0;

      @provide(token)
      get overrideCandidate() {
        this.callCount += 1;
        return 'from-child';
      }
    }

    const parent = new Container();
    parent.bind(token, () => 'from-parent');

    const child = new ChildContainer(parent);

    expect(child.get(token)).toBe('from-parent');
    expect(child.callCount).toBe(0);
  });

  it('должен выбрасывать DIEngineError, если декоратор применён не к геттеру', () => {
    const token = Symbol('provide-invalid') as Identifier<string>;
    const decorator = provide<string>(token);
    const fakeContext = {
      kind: 'method',
      name: 'invalid',
      addInitializer: () => {
        throw new Error('initializer must not be called');
      },
    } as unknown;

    expect(() =>
      decorator(
        function thisShouldNotMatter() {
          return 'value';
        },
        fakeContext as ClassGetterDecoratorContext<Container, string>,
      ),
    ).toThrow(DIEngineError);
  });
});
