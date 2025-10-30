import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';

import { extractSource } from '@/shared/react-navigation-trail';
import { useCreation, useUnmount } from '@/shared/utils/react';

import type { Container, ContainerConstructor } from '../../Container';
import { useContainerRegistry } from '../ContainerRegistryProvider';
import { resolveParentContainer } from '../resolveParentContainer';

type AnyNavigation = NavigationProp<ParamListBase, string>;
type AnyRoute = RouteProp<ParamListBase, string>;

/**
 * Содержит контейнер и ключ маршрута, в рамках которого он создан.
 */
export interface ContainerContextValue {
  container: Container;
  routeKey: string;
}

const ContainerContext = createContext<ContainerContextValue | null>(null);

export interface ContainerProviderProps<T extends Container = Container> extends PropsWithChildren {
  containerClass?: ContainerConstructor<T>;
}

/**
 * Оборачивает компонент в контекст контейнера.
 *
 * Создает контейнер по классу или использует родительский, регистрирует его в реестре и
 * предоставляет дочерним компонентам через `ContainerContext`.
 */
export function ContainerProvider<T extends Container = Container>({
  containerClass,
  children,
}: ContainerProviderProps<T>) {
  const navigation = useNavigation<AnyNavigation>();
  const route = useRoute<AnyRoute>();
  const registry = useContainerRegistry();
  const parentContext = useContainerContext();

  const routeKey = route.key;

  const { container, registered } = useCreation<{
    container: Container;
    registered: boolean;
  }>(() => {
    const existing = registry.get(routeKey);

    const parentContainer =
      existing ??
      resolveParentContainer({
        registry,
        navigation,
        currentRouteKey: routeKey,
        sourceKey: extractSource(route),
        contextParent: parentContext,
      });

    const createdContainer = containerClass
      ? new containerClass(parentContainer, route.params, { navigation, route })
      : parentContainer;

    // Если используется уже зарегистрированный контейнер в качестве родителя, то не регистрируем новый,
    // так как слот в реестре уже занят. С этим есть проблема, если контейнер используется только в какой-то
    // части экрана, а не для всего экрана. Тогда мы потеряем контейнер при размонтировании этой части экрана.
    //
    // Следует доработать алгоритм регистрации контейнеров, чтобы он учитывал эту ситуацию, если такая ситуация
    // однажды возникнет.
    const shouldRegister = !existing;

    if (shouldRegister) {
      registry.register(routeKey, createdContainer);
    }

    return { container: createdContainer, registered: shouldRegister };
  }, [registry, routeKey, navigation, parentContext, containerClass, route.params]);

  useUnmount(() => {
    if (registered) {
      registry.unregister(routeKey);
    }
  });

  const contextValue = useMemo<ContainerContextValue>(
    () => ({
      container,
      routeKey,
    }),
    [container, routeKey],
  );

  return <ContainerContext.Provider value={contextValue}>{children}</ContainerContext.Provider>;
}

/**
 * Возвращает значение `ContainerContext`, если оно задано.
 */
export function useContainerContext(): ContainerContextValue | null {
  return useContext(ContainerContext);
}
