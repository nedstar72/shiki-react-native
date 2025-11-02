import { observable, runInAction, transaction } from 'mobx';

import toStream from './index';

describe('toStream', () => {
  it('должен испускать события при изменении состояния', () => {
    const state = observable({ count: 0 });
    const { observable: stream, disposer } = toStream(state);

    const snapshots: (typeof state)[] = [];
    stream.subscribe(value => snapshots.push(value));

    runInAction(() => {
      state.count = 1;
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({ count: 1 });

    disposer();
  });

  it('должен не испускать значение при повторном присваивании идентичного значения', () => {
    const state = observable({ flag: true });
    const { observable: stream, disposer } = toStream(state);

    const snapshots: { flag: boolean }[] = [];
    stream.subscribe(value => snapshots.push(value));

    runInAction(() => {
      state.flag = true;
    });

    expect(snapshots).toHaveLength(0);

    disposer();
  });

  it('должен пропускать промежуточные изменения', () => {
    const state = observable({ nested: { count: 0 } });
    const { observable: stream, disposer } = toStream(state);

    const snapshots: (typeof state)[] = [];
    stream.subscribe(value => snapshots.push(value));

    runInAction(() => {
      state.nested = { count: 1 };
      state.nested = { count: 2 };
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toEqual({ nested: { count: 2 } });

    disposer();
  });

  it('должен завершать observable после disposer()', () => {
    const state = observable({ value: 0 });
    const { observable: stream, disposer } = toStream(state);

    const snapshots: (typeof state)[] = [];
    const complete = jest.fn();
    stream.subscribe({
      next: (value: { value: number }) => snapshots.push(value),
      complete,
    });

    expect(snapshots).toHaveLength(0);

    disposer();

    expect(complete).toHaveBeenCalledTimes(1);

    runInAction(() => {
      state.value = 1;
    });

    expect(snapshots).toHaveLength(0);
    expect(() => disposer()).not.toThrow();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('должен испускать текущее значение после создания при fireImmediately = true', () => {
    const state = observable({ count: 0 });
    const { observable: stream, disposer } = toStream(state, { fireImmediately: true });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(value => snapshots.push(value));

    expect(snapshots).toHaveLength(1);

    runInAction(() => {
      state.count = 1;
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]).not.toBe(snapshots[1]);
    expect(snapshots[0]).toEqual({ count: 0 });
    expect(snapshots[1]).toEqual({ count: 1 });

    disposer();
  });

  it('должен поддерживать Array', () => {
    const state = observable(['a', 'b']);
    const { observable: stream, disposer } = toStream(state);

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    runInAction(() => {
      state.push('c');
    });

    runInAction(() => {
      state.splice(1, 1, 'x');
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0]).not.toBe(snapshots[1]);
    expect(snapshots[0]).toEqual(['a', 'b', 'c']);
    expect(snapshots[1]).toEqual(['a', 'x', 'c']);

    disposer();
  });

  it('должен поддерживать Map', () => {
    const state = observable(new Map([['a', { value: 1 }]]));
    const { observable: stream, disposer } = toStream(state);

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    runInAction(() => {
      state.set('b', { value: 2 });
    });

    expect(Array.from(snapshots[0].entries())).toEqual([
      ['a', { value: 1 }],
      ['b', { value: 2 }],
    ]);

    runInAction(() => {
      state.set('a', { value: 42 });
    });

    expect(snapshots[1].get('a')?.value).toBe(42);
    expect(snapshots[0]).not.toBe(snapshots[1]);

    disposer();
  });

  it('должен обрабатывать Map с составными и числовыми строковыми ключами', () => {
    const state = observable(
      new Map([
        ['a.b', { value: 1 }],
        ['42', { value: 2 }],
      ]),
    );
    const { observable: stream, disposer } = toStream(state, { fireImmediately: true });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    runInAction(() => {
      state.set('a.b', { value: 10 });
      state.set('42', { value: 20 });
    });

    expect(snapshots).toHaveLength(2);
    expect(Array.from(snapshots[0].entries())).toEqual([
      ['a.b', { value: 1 }],
      ['42', { value: 2 }],
    ]);
    expect(Array.from(snapshots[1].entries())).toEqual([
      ['a.b', { value: 10 }],
      ['42', { value: 20 }],
    ]);

    runInAction(() => {
      state.set('42', { value: 21 });
    });

    expect(snapshots).toHaveLength(3);
    expect(snapshots[2].get('42')?.value).toBe(21);

    disposer();
  });

  it('должен реагировать на изменения любой вложенности в deep режиме', () => {
    const state = observable({
      map: new Map([['value', 1]]),
    });
    const { observable: stream, disposer } = toStream(state, { trackMode: 'deep' });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    runInAction(() => {
      state.map.set('value', 2);
    });

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].map).toEqual(new Map([['value', 2]]));

    disposer();
  });

  it('должен сохранять ссылки на неизмененные ветки состояния в deep режиме', () => {
    const state = observable({
      changed: { value: 0 },
      stable: { flag: true },
    });
    const { observable: stream, disposer } = toStream(state, {
      trackMode: 'deep',
      fireImmediately: true,
    });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    runInAction(() => {
      state.changed.value = 1;
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].changed.value).toBe(0);
    expect(snapshots[1].changed.value).toBe(1);
    expect(snapshots[0].changed).not.toBe(snapshots[1].changed);
    expect(snapshots[0].stable).toBe(snapshots[1].stable);

    disposer();
  });

  it('должен игнорировать batching в deep режиме', () => {
    const state = observable({
      nested: { value: 1 },
    });
    const { observable: stream, disposer } = toStream(state, { trackMode: 'deep' });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    transaction(() => {
      state.nested.value = 2;
      state.nested = { value: 3 };
    });

    expect(snapshots).toHaveLength(2);
    expect(snapshots[0].nested.value).toBe(2);
    expect(snapshots[1].nested.value).toBe(3);

    disposer();
  });

  it('должен не реагировать на вложенный Set в deep режиме', () => {
    const state = observable({
      set: new Set([{ label: 'first' }]),
    });
    const { observable: stream, disposer } = toStream(state, {
      trackMode: 'deep',
      fireImmediately: true,
    });

    const snapshots: (typeof state)[] = [];
    stream.subscribe(next => snapshots.push(next));

    expect(snapshots).toHaveLength(1);
    expect(Array.from(snapshots[0].set)).toEqual([{ label: 'first' }]);

    runInAction(() => {
      state.set.add({ label: 'second' });
    });

    runInAction(() => {
      const first = Array.from(state.set.values())[0];
      first.label = 'first-updated';
    });

    runInAction(() => {
      const second = Array.from(state.set.values()).find(item => item.label === 'second');
      if (second) state.set.delete(second);
    });

    expect(snapshots).toHaveLength(1);
    expect(Array.from(state.set)[0].label).toBe('first-updated');
    expect(Array.from(snapshots[0].set)).toEqual([{ label: 'first' }]);

    disposer();
  });
});
