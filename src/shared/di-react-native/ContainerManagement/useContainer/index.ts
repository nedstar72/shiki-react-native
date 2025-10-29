import {
  useNavigation,
  useRoute,
  type NavigationProp,
  type NavigationState,
  type ParamListBase,
  type RouteProp,
} from '@react-navigation/native';

import { SOURCE_PARAM_KEY } from '@/shared/react-navigation-trail';
import { isNotDefined, isNumber, isObject, isString } from '@/shared/utils/js';
import { useCreation, useUnmount } from '@/shared/utils/react';

import type { Container, ContainerConstructor } from '../../Container';
import { useContainerRegistry, type ContainerRegistry } from '../ContainerRegistryProvider';

type AnyNavigation = NavigationProp<ParamListBase, string>;
type AnyRoute = RouteProp<ParamListBase, string>;
type AnyState = NavigationState<ParamListBase>;

/**
 * Создает и возвращает контейнер зависимостей, связанный с текущим маршрутом.
 *
 * @param ContainerClass Класс контейнера для создания экземпляра.
 * @returns Экземпляр контейнера зависимостей.
 */
export default function useContainer<TContainer extends Container = Container>(
  ContainerClass?: ContainerConstructor<TContainer>,
): TContainer {
  const navigation = useNavigation<AnyNavigation>();
  const route = useRoute<AnyRoute>();
  const registry = useContainerRegistry();

  const routeKey = route.key;
  const sourceKey = extractSource(route);

  const container = useCreation<TContainer>(() => {
    const existing = registry.get(routeKey) as TContainer | undefined;
    if (existing) {
      return existing;
    }

    const parentContainer = resolveParentContainer({
      registry,
      navigation,
      currentRouteKey: routeKey,
      sourceKey,
    });

    const container = ContainerClass
      ? new ContainerClass(parentContainer, route.params, { navigation, route })
      : parentContainer;

    registry.register(routeKey, container);

    return container as TContainer;
  }, [registry, routeKey]);

  useUnmount(() => {
    registry.unregister(routeKey);
  });

  return container;
}

/**
 * Извлекает идентификатор источника из параметров маршрута.
 *
 * Возвращает ключ родительского маршрута, если он передан в параметрах.
 */
function extractSource(route: AnyRoute): string | undefined {
  const params = route.params;
  if (isNotDefined(params) || !isObject(params)) {
    return undefined;
  }

  const source = params[SOURCE_PARAM_KEY];
  return isString(source) ? source : undefined;
}

/**
 * Определяет родительский контейнер для текущего маршрута.
 *
 * Выполняет поиск по source, текущему стеку и родительским стекам, возвращая корневой контейнер по умолчанию.
 * @param registry Реестр контейнеров.
 * @param navigation Экземпляр навигации текущего экрана.
 * @param currentRouteKey Ключ текущего маршрута.
 * @param sourceKey Ключ маршрута-источника.
 * @returns Родительский контейнер.
 */
function resolveParentContainer({
  registry,
  navigation,
  currentRouteKey,
  sourceKey,
}: {
  registry: ContainerRegistry;
  navigation: AnyNavigation;
  currentRouteKey: string;
  sourceKey?: string;
}): Container {
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
 *
 * @param state Состояние навигации для обхода.
 * @param registry Реестр контейнеров.
 * @param excludeKey Ключ маршрута, который следует пропустить.
 * @returns Найденный контейнер или undefined.
 */
function findNearestContainerInState(
  state: AnyState,
  registry: ContainerRegistry,
  excludeKey?: string,
): Container | undefined {
  const { routes } = state;
  const startIndex = isNumber(state.index) ? state.index : routes.length - 1;

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
 *
 * @param route Маршрут из состояния навигации.
 * @param registry Реестр контейнеров.
 * @param excludeKey Ключ маршрута, который следует пропустить.
 * @returns Найденный контейнер или undefined.
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
  const activeIndex = isNumber(state.index) ? state.index : 0;
  return state.routes[activeIndex]?.key;
}
