import { Container } from './index';
import type { Token } from '../Token';

describe('Container', () => {
  it('должен вызывать фабрику при каждом разрешении для transient-биндинга', () => {
    const token = Symbol('transient') as Token<{ call: number }>;
    const container = new Container();
    let call = 0;
    const factory = jest.fn((): { call: number } => ({ call: ++call }));

    container.bind(token, factory);

    const first = container.get(token);
    const second = container.get(token);

    expect(factory).toHaveBeenCalledTimes(2);
    expect(first).not.toBe(second);
    expect(first.call).toBe(1);
    expect(second.call).toBe(2);
  });

  it('должен переиспользовать singleton при shared-биндинге', () => {
    const token = Symbol('shared') as Token<{ call: number }>;
    const container = new Container();
    let call = 0;
    const factory = jest.fn((): { call: number } => ({ call: ++call }));

    container.bind(token, factory, true);

    const first = container.get(token);
    const second = container.get(token);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(first.call).toBe(1);
    expect(first).toBe(second);
  });

  it('должен возвращать undefined через getSafely при отсутствии биндинга', () => {
    const token = Symbol('optional') as Token<number>;
    const container = new Container();

    expect(container.getSafely(token)).toBeUndefined();
    expect(() => container.get(token)).toThrow();

    container.bind(token, () => 42);

    expect(container.getSafely(token)).toBe(42);
  });

  it('должен отражать состояние биндинга через isBound', () => {
    const token = Symbol('isBound') as Token<string>;
    const container = new Container();

    expect(container.isBound(token)).toBe(false);

    container.bind(token, () => 'value');

    expect(container.isBound(token)).toBe(true);
  });

  it('должен делегировать разрешение родителю и поддерживать локальный override', () => {
    const token = Symbol('delegation') as Token<string>;
    const parent = new Container();
    parent.bind(token, () => 'from-parent');

    const child = new Container(parent);

    expect(child.get(token)).toBe('from-parent');

    child.bind(token, () => 'from-child');

    expect(child.get(token)).toBe('from-child');
    expect(parent.get(token)).toBe('from-parent');
  });

  it('должен поддерживать класс в качестве идентификатора зависимости', () => {
    class Service {
      constructor(public readonly value: number) {}
    }

    const container = new Container();
    let counter = 0;

    container.bind(Service, () => new Service(++counter));

    const first = container.get(Service);
    const second = container.get(Service);

    expect(first).not.toBe(second);
    expect(first.value).toBe(1);
    expect(second.value).toBe(2);
  });
});
