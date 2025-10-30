import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';

import { extractSource } from '@/shared/react-navigation-trail';
import { useCreation } from '@/shared/utils/react';

import type { Container } from '../../Container';
import { useContainerContext } from '../ContainerContext';
import { useContainerRegistry } from '../ContainerRegistryProvider';
import { resolveParentContainer } from '../resolveParentContainer';

type AnyNavigation = NavigationProp<ParamListBase, string>;
type AnyRoute = RouteProp<ParamListBase, string>;

/**
 * Возвращает ближайший контейнер зависимостей для текущего маршрута.
 *
 * Хук предпочитает контейнер из `ContainerContext`, затем пытается использовать уже
 * зарегистрированный контейнер и только после этого определяет родителя через навигацию.
 */
export default function useContainer<TContainer extends Container = Container>(): TContainer {
  const navigation = useNavigation<AnyNavigation>();
  const route = useRoute<AnyRoute>();
  const registry = useContainerRegistry();
  const contextParent = useContainerContext();

  const routeKey = route.key;

  const container = useCreation<TContainer>(() => {
    // 1. В приоритете ближайший контейнер из контекста, если он соответствует текущему маршруту.
    if (contextParent?.routeKey === routeKey) {
      return contextParent.container as TContainer;
    }

    // 2. Затем проверяем, есть ли уже зарегистрированный контейнер для этого маршрута.
    const existing = registry.get(routeKey) as TContainer | undefined;
    if (existing) {
      return existing;
    }

    // 3. Если нет зарегистрированного контейнера, то определяем родителя через навигацию.
    return resolveParentContainer({
      registry,
      navigation,
      currentRouteKey: routeKey,
      sourceKey: extractSource(route),
      contextParent,
    }) as TContainer;
  }, [contextParent]);

  return container;
}
