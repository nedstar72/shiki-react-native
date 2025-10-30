import type { NavigationProp, NavigationState, ParamListBase } from '@react-navigation/native';

import type { Container } from '../Container';
import type { ContainerContextValue } from './ContainerContext';
import type { ContainerRegistry } from './ContainerRegistryProvider';

type AnyNavigation = NavigationProp<ParamListBase, string>;
type AnyState = NavigationState<ParamListBase>;

export interface ContainerResolutionContext {
  registry: ContainerRegistry;
  navigation: AnyNavigation;
  currentRouteKey: string;
  sourceKey?: string;
  contextParent: ContainerContextValue | null;
}

/**
 * Определяет родительский контейнер для текущего маршрута.
 *
 * Выполняет поиск сначала в контексте, затем по source, текущему стеку и родительским стекам,
 * возвращая корневой контейнер по умолчанию.
 */
export function resolveParentContainer({
  registry,
  navigation,
  currentRouteKey,
  sourceKey,
  contextParent,
}: ContainerResolutionContext): Container {
  if (contextParent?.routeKey === currentRouteKey) {
    return contextParent.container;
  }

  if (sourceKey) {
    const containerBySource = registry.get(sourceKey);
    if (containerBySource) {
      return containerBySource;
    }
  }

  const currentState = navigation.getState();
  const fromSameLevel = findNearestContainerInState(currentState, registry, currentRouteKey);
  if (fromSameLevel) {
    return fromSameLevel;
  }

  let parentNavigation = navigation.getParent?.();
  while (parentNavigation) {
    const parentState = parentNavigation.getState();
    const activeRouteKey = getActiveRouteKey(parentState);
    const candidate = findNearestContainerInState(parentState, registry, activeRouteKey);
    if (candidate) {
      return candidate;
    }
    parentNavigation = parentNavigation.getParent?.();
  }

  return registry.getRootContainer();
}

/**
 * Ищет ближайший контейнер в заданном состоянии навигации.
 *
 * Последовательно проходит по маршрутам от активного к старшим и проверяет наличие контейнера в реестре.
 */
function findNearestContainerInState(
  state: AnyState,
  registry: ContainerRegistry,
  excludeKey?: string,
): Container | undefined {
  const { routes } = state;
  const startIndex = typeof state.index === 'number' ? state.index : routes.length - 1;

  for (let index = startIndex; index >= 0; index -= 1) {
    const route = routes[index];
    const container = findContainerInRoute(route, registry, excludeKey);
    if (container) {
      return container;
    }
  }

  return undefined;
}

/**
 * Ищет зарегистрированный контейнер для конкретного маршрута.
 *
 * При наличии вложенного состояния выполняет рекурсивный поиск.
 */
function findContainerInRoute(
  route: AnyState['routes'][number],
  registry: ContainerRegistry,
  excludeKey?: string,
): Container | undefined {
  if (route.key === excludeKey) {
    return undefined;
  }

  const childState = route.state as AnyState | undefined;
  if (childState) {
    const nested = findNearestContainerInState(childState, registry, excludeKey);
    if (nested) {
      return nested;
    }
  }

  return registry.get(route.key);
}

/**
 * Возвращает ключ активного маршрута в состоянии навигации.
 *
 * Учитывает индекс активного маршрута или использует первый маршрут в стеке.
 */
function getActiveRouteKey(state: AnyState): string | undefined {
  const activeIndex = typeof state.index === 'number' ? state.index : 0;
  return state.routes[activeIndex]?.key;
}
