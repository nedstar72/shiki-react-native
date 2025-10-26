import React, { useEffect } from 'react';
import { render, waitFor, cleanup } from '@testing-library/react-native';

import useContainer from './index';
import type { Container, ContainerConstructor, NavigationContext } from '../../Container';
import { SOURCE_PARAM_KEY } from '../useTrailNavigation';

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
  useRoute: jest.fn(),
}));

jest.mock('../ContainerRegistryProvider', () => ({
  useContainerRegistry: jest.fn(),
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

type NavigationStateLike = {
  routes: RouteLike[];
  index?: number;
};

type RouteLike = {
  key: string;
  state?: NavigationStateLike;
};

type TestableContainer = Container & {
  parent?: Container | null;
  params?: unknown;
  navigation?: NavigationContext;
  id?: string;
};

describe('useContainer', () => {
  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });

  it('должен возвращать уже зарегистрированный контейнер по key текущего route', async () => {
    const routeKey = 'route-current';

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const existingContainer = createContainer('existing');
    const registry = mockRegistry({
      get: jest.fn(key => (key === routeKey ? existingContainer : undefined)),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(existingContainer);
    });

    expect(registry.register).not.toHaveBeenCalled();
    expect(registry.unregister).not.toHaveBeenCalled();
  });

  it('должен создавать контейнер на основе класса и родителя из source', async () => {
    const routeKey = 'child-route';
    const parentKey = 'parent-route';
    const params = { [SOURCE_PARAM_KEY]: parentKey, value: 42 };

    const route = mockRoute({ key: routeKey, params });
    const navigation = mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

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

    const ContainerClass = createContainerClass();
    const onContainer = jest.fn();

    render(<HookConsumer onContainer={onContainer} containerClass={ContainerClass} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalled();
    });

    const createdContainer: TestableContainer = onContainer.mock.lastCall[0];
    expect(createdContainer).toBeInstanceOf(ContainerClass);
    expect(createdContainer.parent).toBe(parentContainer);
    expect(createdContainer.params).toBe(params);
    expect(createdContainer.navigation?.navigation).toBe(navigation);
    expect(createdContainer.navigation?.route).toEqual(route);

    expect(registry.register).toHaveBeenCalledWith(routeKey, createdContainer);
  });

  it('должен возвращать контейнер родителя, если класс не передан', async () => {
    const routeKey = 'child-route';
    const parentKey = 'parent-route';
    const params = { [SOURCE_PARAM_KEY]: parentKey };

    mockRoute({ key: routeKey, params });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const parentContainer = createContainer('parent');
    const registry = mockRegistry({
      get: jest.fn(key => (key === parentKey ? parentContainer : undefined)),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(parentContainer);
    });

    expect(registry.register).toHaveBeenCalledWith(routeKey, parentContainer);
  });

  it('должен искать ближайший контейнер в текущем стеке навигации, если source отсутствует', async () => {
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
      getRootContainer: jest.fn(),
    });

    const onContainer = jest.fn();
    render(<HookConsumer onContainer={onContainer} />);

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(siblingContainer);
    });

    expect(registry.register).toHaveBeenCalledWith(routeKey, siblingContainer);
    expect(registry.getRootContainer).not.toHaveBeenCalled();
  });

  it('должен искать ближайший контейнер в родительском стеке навигации, если source отсутствует и нет контейнера в текущем стеке', async () => {
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

    expect(registry.register).toHaveBeenCalledWith(routeKey, siblingContainer);
    expect(registry.getRootContainer).not.toHaveBeenCalled();
  });

  it('должен использовать корневой контейнер, если не найден ни один контейнер по навигации', async () => {
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

    expect(registry.register).toHaveBeenCalledWith(routeKey, rootContainer);
    expect(registry.getRootContainer).toHaveBeenCalledTimes(1);
  });

  it('должен разрегистрировать контейнер при размонтировании', async () => {
    const routeKey = 'route-current';

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const registry = mockRegistry({
      get: jest.fn(() => undefined),
    });

    const ContainerClass = createContainerClass();
    const onContainer = jest.fn();
    const { unmount } = render(
      <HookConsumer onContainer={onContainer} containerClass={ContainerClass} />,
    );

    unmount();

    expect(registry.unregister).toHaveBeenCalledWith(routeKey);
  });
});

function HookConsumer({
  containerClass,
  onContainer,
}: {
  containerClass?: ContainerConstructor<Container>;
  onContainer: (container: Container) => void;
}) {
  const container = useContainer(containerClass);

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
  };
}

function createContainerClass(): ContainerConstructor<TestableContainer> {
  return class TestContainer implements TestableContainer {
    public parent?: Container | null;

    public params?: unknown;

    public navigation?: NavigationContext;

    public id?: string;

    constructor(parent?: Container | null, params?: unknown, navigation?: NavigationContext) {
      this.parent = parent ?? null;
      this.params = params;
      this.navigation = navigation;
    }

    get<T>(): T {
      return undefined as unknown as T;
    }
  };
}

function mockRoute({ key, params }: { key: string; params?: Record<string, unknown> }) {
  const route = {
    key,
    params,
  };

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
