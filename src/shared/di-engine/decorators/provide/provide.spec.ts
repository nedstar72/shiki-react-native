import { provide } from './index';
import { Container } from '../../Container';
import DIEngineError from '../../DIEngineError';
import { Module } from '../../Module';
import type { Token } from '../../Token';

describe('@provide', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Container', () => {
    it('должен регистрировать геттер как transient-зависимость по-умолчанию', () => {
      const token = Symbol('provide-transient') as Token<{ call: number }>;

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

    it('должен поддерживать регистрацию singleton-зависимости при shared: true', () => {
      const token = Symbol('provide-shared') as Token<{ call: number }>;

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

    it('должен поддерживать переопределение зависимости родителя', () => {
      const token = Symbol('provide-parent') as Token<string>;

      class ChildContainer extends Container {
        callCount = 0;

        @provide(token)
        get overrideCandidate() {
          this.callCount += 1;
          return 'from-child';
        }
      }

      class ParentContainer extends Container {
        callCount = 0;

        @provide(token, { shared: true })
        get provided() {
          this.callCount += 1;
          return 'from-parent';
        }
      }

      const parent = new ParentContainer();
      const child = new ChildContainer(parent);

      expect(child.get(token)).toBe('from-child');
      expect(parent.callCount).toBe(0);
      expect(child.callCount).toBe(1);
    });
  });

  describe('Module', () => {
    it('должен добавлять зависимость в контейнер при загрузке', () => {
      const token = Symbol('module-provide-transient') as Token<{ call: number }>;

      class TransientModule extends Module {
        callCount = 0;

        @provide(token)
        get dependency() {
          return { call: ++this.callCount };
        }
      }

      const module = new TransientModule();
      const container = new Container();

      container.load(module);

      const first = container.get(token);
      const second = container.get(token);

      expect(first.call).toBe(1);
      expect(second.call).toBe(2);
    });

    it('должен поддерживать регистрацию singleton-зависимости при shared: true', () => {
      const token = Symbol('module-provide-shared') as Token<{ call: number }>;

      class SharedModule extends Module {
        callCount = 0;

        @provide(token, { shared: true })
        get singleton() {
          return { call: ++this.callCount };
        }
      }

      const module = new SharedModule();
      const container = new Container();

      container.load(module);

      const first = container.get(token);
      const second = container.get(token);

      expect(first).toBe(second);
    });

    it('должен не переопределять существующий биндинг контейнера', () => {
      const token = Symbol('module-provide-existing') as Token<string>;

      class ExistingModule extends Module {
        callCount = 0;

        @provide(token, { shared: true })
        get existing() {
          this.callCount += 1;
          return 'from-existing';
        }
      }

      class OverrideModule extends Module {
        callCount = 0;

        @provide(token)
        get overrideCandidate() {
          this.callCount += 1;
          return 'from-module';
        }
      }

      const container = new Container();
      const existingModule = new ExistingModule();
      container.load(existingModule);

      const module = new OverrideModule();

      expect(() => container.load(module)).toThrow(DIEngineError);
      expect(container.get(token)).toBe('from-existing');
      expect(module.callCount).toBe(0);
      expect(existingModule.callCount).toBe(1);
    });
  });

  it('должен выбрасывать DIEngineError, если декоратор применён не к геттеру', () => {
    const token = Symbol('provide-invalid') as Token<string>;
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
