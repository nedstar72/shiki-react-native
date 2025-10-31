import type { Disposable } from '../Disposable';
import DisposableBag from './index';

describe('DisposableBag', () => {
  it('должен поддерживать Disposable в качестве элементов', () => {
    const disposable: Disposable = { dispose: jest.fn() };
    const bag = new DisposableBag([disposable]);

    bag.dispose();

    expect(disposable.dispose).toHaveBeenCalledTimes(1);
  });

  it('должен поддерживать функции в качестве элементов', () => {
    const cleanup = jest.fn();
    const bag = new DisposableBag([cleanup]);

    bag.dispose();
    bag.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('должен единоразово вызывать dispose у элементов', () => {
    const cleanup = jest.fn();
    const bag = new DisposableBag([cleanup]);

    bag.dispose();
    bag.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('должен не добавлять одинаковые элементы дважды', () => {
    const cleanup = jest.fn();
    const bag = new DisposableBag();

    bag.add(cleanup).add(cleanup);

    expect(bag.size).toBe(1);

    bag.dispose();

    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('должен удалять элементы через delete', () => {
    const first = jest.fn();
    const second = jest.fn();
    const bag = new DisposableBag([first, second]);

    expect(bag.size).toBe(2);

    const deleted = bag.delete(first);

    expect(deleted).toBe(true);
    expect(bag.size).toBe(1);

    bag.dispose();

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('должен немедленно освобождать элементы, добавленные после dispose', () => {
    const cleanup = jest.fn();
    const bag = new DisposableBag();

    bag.dispose();
    bag.add(cleanup);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(bag.size).toBe(0);
  });

  it('должен агрегировать ошибки при dispose', () => {
    const first: Disposable = {
      dispose: jest.fn(() => {
        throw new Error('first');
      }),
    };
    const second: Disposable = {
      dispose: jest.fn(() => {
        throw new Error('second');
      }),
    };
    const bag = new DisposableBag([first, second]);

    expect(() => bag.dispose()).toThrow(AggregateError);
  });
});
