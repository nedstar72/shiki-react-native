import React, { type DependencyList } from 'react';
import { cleanup, render } from '@testing-library/react-native';

import useLazyCreation from './index';

describe('useLazyCreation', () => {
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('должен лениво вызвать фабрику при первом использовании значения', () => {
    const factory = jest.fn(() => ({ value: 'created' }));
    const onValue = jest.fn();

    render(<HookConsumer factory={factory} onValue={onValue} />);

    expect(onValue).toHaveBeenCalledTimes(1);

    const lazyValue = onValue.mock.lastCall?.[0] as { value: string };

    expect(factory).not.toHaveBeenCalled();

    expect(lazyValue.value).toBe('created');
    expect(factory).toHaveBeenCalledTimes(1);
    expect(lazyValue.value).toBe('created');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('должен пересоздавать значение только при изменении зависимостей', () => {
    let creationCount = 0;
    const factory = jest.fn(() => ({ token: ++creationCount }));
    const onValue = jest.fn();

    const { rerender } = render(<HookConsumer factory={factory} deps={[1]} onValue={onValue} />);

    expect(onValue).toHaveBeenCalledTimes(1);

    const firstValue = onValue.mock.lastCall?.[0] as { token: number };

    expect(factory).not.toHaveBeenCalled();

    expect(firstValue.token).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);

    rerender(<HookConsumer factory={factory} deps={[1]} onValue={onValue} />);

    const secondValue = onValue.mock.lastCall?.[0] as { token: number };
    expect(secondValue).toBe(firstValue);

    expect(secondValue.token).toBe(1);
    expect(factory).toHaveBeenCalledTimes(1);

    rerender(<HookConsumer factory={factory} deps={[2]} onValue={onValue} />);

    const thirdValue = onValue.mock.lastCall?.[0] as { token: number };

    expect(thirdValue).not.toBe(firstValue);
    expect(factory).toHaveBeenCalledTimes(1);

    expect(thirdValue.token).toBe(2);
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

function HookConsumer<T>({
  factory,
  deps,
  onValue,
}: {
  factory: () => T;
  deps?: DependencyList;
  onValue: (value: T) => void;
}) {
  const value = useLazyCreation(factory, deps);
  onValue(value);
  return null;
}
