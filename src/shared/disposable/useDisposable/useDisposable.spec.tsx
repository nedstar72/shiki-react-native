import { renderHook } from '@testing-library/react-native';

import type { Disposable } from '../Disposable';
import useDisposable from './index';

describe('useDisposable', () => {
  it('должен создавать disposable через фабрику и уничтожать его при размонтировании', () => {
    const dispose = jest.fn();
    const factory = jest.fn((): Disposable => ({ dispose }));

    const { unmount } = renderHook<Disposable, void>(() => useDisposable(factory));

    expect(factory).toHaveBeenCalledTimes(1);
    expect(dispose).not.toHaveBeenCalled();

    unmount();

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('должен пересоздавать disposable и уничтожать предыдущий при изменении deps', () => {
    const factory = jest.fn(
      (): Disposable => ({
        dispose: jest.fn(),
      }),
    );

    const { rerender, result, unmount } = renderHook<Disposable, { dep: number }>(
      ({ dep }) => useDisposable(factory, [dep]),
      { initialProps: { dep: 1 } },
    );

    const first = result.current;
    const firstDispose = first.dispose;

    rerender({ dep: 2 });

    expect(factory).toHaveBeenCalledTimes(2);
    expect(firstDispose).toHaveBeenCalledTimes(1);

    unmount();

    expect(result.current.dispose).toHaveBeenCalledTimes(1);
  });

  it('должен поддерживать переданный готовый disposable', () => {
    const instance: Disposable = { dispose: jest.fn() };

    const { unmount, result } = renderHook<Disposable, void>(() => useDisposable(instance));

    expect(result.current).toBe(instance);

    unmount();

    expect(instance.dispose).toHaveBeenCalledTimes(1);
  });
});
