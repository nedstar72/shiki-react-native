import React, { useEffect } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { SOURCE_PARAM_KEY } from '@/shared/react-navigation-trail';

import useContainer from './index';
import type { Container, NavigationContext } from '../../Container';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('../ContainerRegistryProvider', () => ({
  useContainerRegistry: jest.fn(),
}));

jest.mock('../ContainerContext', () => ({
  useContainerContext: jest.fn(),
}));

const { useNavigation } = jest.requireMock('@react-navigation/native') as {
  useNavigation: jest.Mock;
};
const { useRoute } = jest.requireMock('@react-navigation/native') as {
  useRoute: jest.Mock;
};
const { useContainerRegistry } = jest.requireMock('../ContainerRegistryProvider') as {
  useContainerRegistry: jest.Mock;
};
const { useContainerContext } = jest.requireMock('../ContainerContext') as {
  useContainerContext: jest.Mock;
};

type NavigationStateLike = {
  routes: RouteLike[];
  index?: number;
};

type RouteLike = {
  key: string;
  params?: Record<string, unknown>;
  state?: NavigationStateLike;
};

type TestableContainer = Container & {
  parent?: Container | null;
  params?: unknown;
  navigation?: NavigationContext;
  id?: string;
};

describe('useContainer', () => {
  beforeEach(() => {
    useContainerContext.mockReturnValue(null);
  });

  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });

  it('должен использовать контейнер из контекста текущего маршрута', async () => {
    const routeKey = 'route-current';

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const contextContainer = createContainer('context');
    useContainerContext.mockReturnValue({ container: contextContainer, routeKey });

    const registry = mockRegistry();

    const onContainer = jest.fn();

    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(contextContainer);
    });

    expect(registry.get).not.toHaveBeenCalled();
    expect(registry.register).not.toHaveBeenCalled();
    expect(registry.unregister).not.toHaveBeenCalled();
  });

  it('должен использовать контейнер текущего маршрута, если нет контейнера из подходящего контекста', async () => {
    useContainerContext.mockReturnValue(null);

    const routeKey = 'child-route';
    const parentKey = 'parent-route';

    mockRoute({ key: routeKey, params: { [SOURCE_PARAM_KEY]: parentKey } });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const parentContainer = createContainer('parent');
    const registry = mockRegistry({
      get: jest.fn(key => {
        if (key === routeKey) {
          return undefined;
        }
        if (key === parentKey) {
          return parentContainer;
        }
        return undefined;
      }),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(parentContainer);
    });

    expect(registry.get).toHaveBeenNthCalledWith(1, routeKey);
    expect(registry.get).toHaveBeenNthCalledWith(2, parentKey);
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('должен использовать родительский контейнер, если нет подходящего контекста и контейнера текущего маршрута', async () => {
    const routeKey = 'child-route';
    const parentKey = 'parent-route';

    mockRoute({ key: routeKey, params: { [SOURCE_PARAM_KEY]: parentKey } });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const parentContainer = createContainer('parent');
    const registry = mockRegistry({
      get: jest.fn(key => {
        if (key === routeKey) {
          return undefined;
        }
        if (key === parentKey) {
          return parentContainer;
        }
        return undefined;
      }),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(parentContainer);
    });

    expect(registry.get).toHaveBeenNthCalledWith(1, routeKey);
    expect(registry.get).toHaveBeenNthCalledWith(2, parentKey);
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('должен использовать ближайший контейнер по состоянию навигации', async () => {
    const routeKey = 'current-route';
    const siblingRouteKey = 'sibling-route';

    mockRoute({ key: routeKey });
    mockNavigation({
      state: {
        routes: [{ key: siblingRouteKey }, { key: routeKey }],
        index: 1,
      },
    });

    const siblingContainer = createContainer('sibling');
    const registry = mockRegistry({
      get: jest.fn(key => {
        if (key === siblingRouteKey) {
          return siblingContainer;
        }
        return undefined;
      }),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(siblingContainer);
    });

    expect(registry.register).not.toHaveBeenCalled();
  });

  it('должен использовать контейнер в родительском стеке навигации, если в текущем стеке контейнера нет', async () => {
    const routeKey = 'current-screen';
    const siblingRouteKey = 'sibling-screen';

    const currentStackState: NavigationStateLike = { routes: [{ key: routeKey }], index: 0 };
    const siblingStackState: NavigationStateLike = { routes: [{ key: siblingRouteKey }], index: 0 };
    const rootNavigation = createNavigation({
      state: {
        routes: [
          { key: 'SiblingStack', state: siblingStackState },
          { key: 'CurrentStack', state: currentStackState },
        ],
        index: 1,
      },
    });

    mockRoute({ key: routeKey });
    mockNavigation({
      state: currentStackState,
      parent: () => rootNavigation,
    });

    const siblingContainer = createContainer('sibling');
    const registry = mockRegistry({
      get: jest.fn(key => {
        if (key === siblingRouteKey) {
          return siblingContainer;
        }
        return undefined;
      }),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(siblingContainer);
    });

    expect(registry.register).not.toHaveBeenCalled();
  });

  it('должен возвращать корневой контейнер, если никаких других контейнеров не найдено', async () => {
    const routeKey = 'current-screen';

    const currentStackState: NavigationStateLike = {
      routes: [{ key: routeKey }],
      index: 0,
    };
    const rootNavigation = createNavigation({
      state: {
        routes: [
          { key: 'SiblingStack', state: { routes: [{ key: 'first' }], index: 0 } },
          { key: 'CurrentStack', state: currentStackState },
        ],
        index: 1,
      },
    });

    mockRoute({ key: routeKey });
    mockNavigation({
      state: currentStackState,
      parent: () => rootNavigation,
    });

    const rootContainer = createContainer('root');
    const registry = mockRegistry({
      get: jest.fn(() => undefined),
      getRootContainer: jest.fn(() => rootContainer),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(rootContainer);
    });

    expect(registry.register).not.toHaveBeenCalled();
    expect(registry.getRootContainer).toHaveBeenCalledTimes(1);
  });
});

function HookConsumer({ onContainer }: { onContainer: (container: Container) => void }) {
  const container = useContainer();

  useEffect(() => {
    onContainer(container);
  }, [container, onContainer]);

  return null;
}

function createContainer(id: string): TestableContainer {
  return {
    id,
    parent: null,
    params: undefined,
    navigation: undefined,
    get: <T,>() => undefined as unknown as T,
    getSafely: <T,>() => undefined as unknown as T,
  };
}

function mockRoute(route: RouteLike) {
  useRoute.mockReturnValue(route);
  return route;
}

function createNavigation({
  state,
  parent,
}: {
  state: NavigationStateLike;
  parent?: () => ReturnType<typeof createNavigation> | undefined;
}) {
  return {
    getState: () => state,
    getParent: parent,
  };
}

function mockNavigation({ state, parent }: Parameters<typeof createNavigation>[0]) {
  const navigation = createNavigation({ state, parent });
  useNavigation.mockReturnValue(navigation);
  return navigation;
}

type ContainerRegistryMock = {
  get: jest.Mock;
  register: jest.Mock;
  unregister: jest.Mock;
  getRootContainer: jest.Mock;
};

function mockRegistry(overrides: Partial<ContainerRegistryMock> = {}): ContainerRegistryMock {
  const registry = {
    get: jest.fn(),
    register: jest.fn(),
    unregister: jest.fn(),
    getRootContainer: jest.fn(),
    ...overrides,
  };
  useContainerRegistry.mockReturnValue(registry);
  return registry;
}
