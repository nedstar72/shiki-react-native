import React, { useEffect } from 'react';
import type { NavigationAction } from '@react-navigation/native';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { useTrailNavigation, SOURCE_PARAM_KEY } from './index';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

const { useNavigation } = jest.requireMock('@react-navigation/native') as {
  useNavigation: jest.Mock;
};
const { useRoute } = jest.requireMock('@react-navigation/native') as {
  useRoute: jest.Mock;
};

describe('useTrailNavigation', () => {
  beforeEach(() => {
    useNavigation.mockReset();
    useRoute.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('должен добавлять source при navigate по строке', async () => {
    const navigationMock = mockNavigation('current-route');
    const navigation = await renderHookAndGetNavigation();

    const params = { foo: 'bar' };
    navigation.navigate('TargetScreen', params);

    expect(params).not.toHaveProperty(SOURCE_PARAM_KEY);
    expect(navigationMock.navigate).toHaveBeenCalledWith(
      'TargetScreen',
      { foo: 'bar', [SOURCE_PARAM_KEY]: 'current-route' },
      undefined,
    );
  });

  it('должен добавлять source при navigate по строке без параметров', async () => {
    const navigationMock = mockNavigation('route-key');
    const navigation = await renderHookAndGetNavigation();

    navigation.navigate('NextScreen');

    expect(navigationMock.navigate).toHaveBeenCalledWith(
      'NextScreen',
      { [SOURCE_PARAM_KEY]: 'route-key' },
      undefined,
    );
  });

  it('должен добавлять source при navigate по объекту', async () => {
    const navigationMock = mockNavigation('stack-key');
    const navigation = await renderHookAndGetNavigation();

    const payload = {
      name: 'NestedScreen',
      params: { initial: true },
      path: 'NestedScreen',
    };

    navigation.navigate(payload);

    const callArg = navigationMock.navigate.mock.calls[0][0];
    expect(callArg).toEqual({
      ...payload,
      params: { initial: true, [SOURCE_PARAM_KEY]: 'stack-key' },
    });
  });

  it('должен добавлять source в push и replace', async () => {
    const navigationMock = mockNavigation('parent-route');
    const navigation = await renderHookAndGetNavigation();

    navigation.push('List', { page: 1 });

    expect(navigationMock.push).toHaveBeenCalledWith('List', {
      page: 1,
      [SOURCE_PARAM_KEY]: 'parent-route',
    });

    navigation.replace({ name: 'Details', params: { id: 10 } });

    const replacePayload = navigationMock.replace.mock.calls[0][0];
    expect(replacePayload).toEqual({
      name: 'Details',
      params: { id: 10, [SOURCE_PARAM_KEY]: 'parent-route' },
    });
  });

  it('должен рекурсивно добавлять source при dispatch сложного экшена', async () => {
    const navigationMock = mockNavigation('origin-route');
    const navigation = await renderHookAndGetNavigation();

    const action: NavigationAction = {
      type: 'RESET',
      payload: {
        params: { alpha: true },
        routes: [
          { key: 'route-a', params: { a: 1 } },
          {
            key: 'route-b',
            state: {
              routes: [{ key: 'inner', params: { b: 2 } }],
            },
          },
        ],
        actions: [
          {
            type: 'NAVIGATE',
            payload: {
              params: { nested: true },
            },
          } as NavigationAction,
        ],
        state: {
          routes: [{ key: 'root-inner', params: { c: 3 } }],
        },
      },
    };

    navigation.dispatch(action);

    const dispatched = navigationMock.dispatch.mock.calls[0][0] as NavigationAction;
    const payload = dispatched.payload as any;

    expect(payload?.params?.[SOURCE_PARAM_KEY]).toBe('origin-route');
    expect(payload?.routes?.[0]?.params?.[SOURCE_PARAM_KEY]).toBe('origin-route');
    expect(payload?.routes?.[1]?.state?.routes?.[0]?.params?.[SOURCE_PARAM_KEY]).toBe(
      'origin-route',
    );
    expect(payload?.actions?.[0]?.payload?.params?.[SOURCE_PARAM_KEY]).toBe('origin-route');
    expect(payload?.state?.routes?.[0]?.params?.[SOURCE_PARAM_KEY]).toBe('origin-route');
  });

  it('должен добавлять source при navigate в nested screen', async () => {
    const navigationMock = mockNavigation('nested-route');
    const navigation = await renderHookAndGetNavigation();

    const params = { screen: 'Settings' };
    navigation.navigate('Home', params);

    expect(navigationMock.navigate).toHaveBeenCalledWith(
      'Home',
      {
        screen: 'Settings',
        params: { [SOURCE_PARAM_KEY]: 'nested-route' },
        [SOURCE_PARAM_KEY]: 'nested-route',
      },
      undefined,
    );
  });
});

function HookConsumer({
  onNavigation,
}: {
  onNavigation: (navigation: ReturnType<typeof useTrailNavigation>) => void;
}) {
  const navigation = useTrailNavigation();

  useEffect(() => {
    onNavigation(navigation);
  }, [navigation, onNavigation]);

  return null;
}

async function renderHookAndGetNavigation() {
  const onNavigation = jest.fn();
  render(<HookConsumer onNavigation={onNavigation} />);

  await waitFor(() => {
    expect(onNavigation).toHaveBeenCalled();
  });

  return onNavigation.mock.lastCall![0];
}

function mockNavigation(routeKey: string) {
  const navigation = {
    navigate: jest.fn(),
    dispatch: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };
  useNavigation.mockReturnValue(navigation);
  useRoute.mockReturnValue({ key: routeKey });
  return navigation;
}
