import { renderHook } from '@testing-library/react-native';

import { ViewModel } from '../ViewModel';
import { useViewModel } from './index';

jest.mock('@/shared/di-react-native', () => ({
  useDependency: jest.fn(),
}));

jest.mock('@/shared/disposable', () => {
  const actual = jest.requireActual('@/shared/disposable');
  return {
    __esModule: true,
    ...actual,
    useDisposable: jest.fn(actual.useDisposable),
  };
});

const { useDependency } = jest.requireMock('@/shared/di-react-native') as {
  useDependency: jest.Mock;
};
const { useDisposable } = jest.requireMock('@/shared/disposable') as {
  useDisposable: jest.Mock;
};

class DummyViewModel extends ViewModel<{ value: number }, { type: 'noop' }> {
  constructor() {
    super({ value: 0 });
  }
}

describe('useViewModel', () => {
  it('должен разрешать зависимость и привязывать ViewModel к жизненному циклу компонента', () => {
    const instance = new DummyViewModel();
    const disposeSpy = jest.spyOn(instance, 'dispose');

    useDependency.mockReturnValue(instance);

    const { result, unmount } = renderHook(() => useViewModel(DummyViewModel));

    expect(useDependency).toHaveBeenCalledWith(DummyViewModel);
    expect(useDisposable).toHaveBeenCalledWith(instance);
    expect(result.current).toBe(instance);

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
  });
});
