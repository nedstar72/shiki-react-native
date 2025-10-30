import React, { useEffect } from 'react';
import { cleanup, render, waitFor } from '@testing-library/react-native';

import { SOURCE_PARAM_KEY } from '@/shared/react-navigation-trail';

import { ContainerProvider } from './index';
import type { Container, ContainerConstructor, NavigationContext } from '../../Container';
import useContainer from '../useContainer';

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

describe('ContainerProvider', () => {
  afterEach(() => {
    jest.resetAllMocks();
    cleanup();
  });

  it('должен создавать контейнер на основе класса и родителя из source', async () => {
    const routeKey = 'child-route';
    const parentKey = 'parent-route';
    const params = { [SOURCE_PARAM_KEY]: parentKey };

    const route = mockRoute({ key: routeKey, params });
    const navigation = mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const parentContainer = createContainer('parent');
    const { registry } = mockRegistry({
      initial: { [parentKey]: parentContainer },
    });

    const ContainerClass = createContainerClass('local');
    const onContainer = jest.fn();

    render(
      <ContainerProvider containerClass={ContainerClass}>
        <HookConsumer onContainer={onContainer} />
      </ContainerProvider>,
    );

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

  it('должен переиспользовать контейнер из контекста при совпадении ключа', async () => {
    const routeKey = 'current-route';
    const rootContainer = createContainer('root');

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const { registry, store } = mockRegistry({ root: rootContainer });
    const ContainerClass = createContainerClass('local');
    const onContainer = jest.fn();

    render(
      <ContainerProvider containerClass={ContainerClass}>
        <ContainerProvider>
          <HookConsumer onContainer={onContainer} />
        </ContainerProvider>
      </ContainerProvider>,
    );

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalled();
    });

    const parentContainer = store.get(routeKey);
    expect(onContainer.mock.lastCall[0]).toBe(parentContainer);
    expect(parentContainer).toBeInstanceOf(ContainerClass);
    expect(registry.register).toHaveBeenCalledTimes(1);
  });

  it('должен регистрировать контейнер родителя, найденного по source, если класс не задан', async () => {
    const routeKey = 'child-route';
    const parentKey = 'parent-route';

    mockRoute({ key: routeKey, params: { [SOURCE_PARAM_KEY]: parentKey } });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const parentContainer = createContainer('parent');
    const { registry } = mockRegistry({
      initial: { [parentKey]: parentContainer },
    });

    const onContainer = jest.fn();

    render(
      <ContainerProvider>
        <HookConsumer onContainer={onContainer} />
      </ContainerProvider>,
    );

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(parentContainer);
    });

    expect(registry.register).toHaveBeenCalledWith(routeKey, parentContainer);
  });

  it('должен регистрировать ближайший контейнер из стейта навигации при отсутствии source и класса', async () => {
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
    const { registry } = mockRegistry({
      initial: { [siblingRouteKey]: siblingContainer },
    });

    const onContainer = jest.fn();

    render(
      <ContainerProvider>
        <HookConsumer onContainer={onContainer} />
      </ContainerProvider>,
    );

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(siblingContainer);
    });

    expect(registry.register).toHaveBeenCalledWith(routeKey, siblingContainer);
  });

  it('должен использовать корневой контейнер, если не был найден контейнер по стейту навигации', async () => {
    const routeKey = 'current-route';
    const rootContainer = createContainer('root');

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const { registry } = mockRegistry({ root: rootContainer });
    const onContainer = jest.fn();

    render(
      <ContainerProvider>
        <HookConsumer onContainer={onContainer} />
      </ContainerProvider>,
    );

    await waitFor(() => {
      expect(onContainer).toHaveBeenCalledWith(rootContainer);
    });

    expect(registry.register).toHaveBeenCalledWith(routeKey, rootContainer);
    expect(registry.getRootContainer).toHaveBeenCalledTimes(1);
  });

  it('должен разрегистрировать контейнер, который зарегистрировал сам', () => {
    const routeKey = 'route-current';
    const rootContainer = createContainer('root');

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const { registry } = mockRegistry({ root: rootContainer });

    const { unmount } = render(
      <ContainerProvider>
        <HookConsumer onContainer={jest.fn()} />
      </ContainerProvider>,
    );

    unmount();

    expect(registry.register).toHaveBeenCalledWith(routeKey, rootContainer);
    expect(registry.unregister).toHaveBeenCalledWith(routeKey);
  });

  it('не должен разрегистрировать контейнер, если используется уже зарегистрированный', () => {
    const routeKey = 'current-route';
    const existingContainer = createContainer('existing');

    mockRoute({ key: routeKey });
    mockNavigation({ state: { routes: [{ key: routeKey }], index: 0 } });

    const { registry } = mockRegistry({
      initial: { [routeKey]: existingContainer },
    });

    const { unmount } = render(
      <ContainerProvider>
        <HookConsumer onContainer={jest.fn()} />
      </ContainerProvider>,
    );

    unmount();

    expect(registry.register).not.toHaveBeenCalled();
    expect(registry.unregister).not.toHaveBeenCalled();
  });
});

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

function createContainerClass(id: string): ContainerConstructor<TestableContainer> {
  return class TestContainer implements TestableContainer {
    public parent?: Container | null;

    public params?: unknown;

    public navigation?: NavigationContext;

    public id?: string;

    constructor(parent?: Container | null, params?: unknown, navigation?: NavigationContext) {
      this.parent = parent ?? null;
      this.params = params;
      this.navigation = navigation;
      this.id = id;
    }

    get<T>(): T {
      return undefined as unknown as T;
    }

    getSafely<T>(): T | undefined {
      return undefined as unknown as T;
    }
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

type MockRegistryOptions = {
  initial?: Record<string, Container>;
  root?: Container;
  overrides?: Partial<ContainerRegistryMock>;
};

function mockRegistry({ initial = {}, root = createContainer('root') }: MockRegistryOptions = {}) {
  const store = new Map<string, Container>(Object.entries(initial));
  const registry: ContainerRegistryMock = {
    get: jest.fn((key: string) => store.get(key)),
    register: jest.fn((key: string, container: Container) => {
      store.set(key, container);
    }),
    unregister: jest.fn((key: string) => {
      store.delete(key);
    }),
    getRootContainer: jest.fn(() => root),
  };

  useContainerRegistry.mockReturnValue(registry);

  return { registry, store, root };
}
