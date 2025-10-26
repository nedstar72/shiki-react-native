import { useRoute, type ParamListBase, type RouteProp } from '@react-navigation/native';

import { useCreation } from '@/shared/utils/react';

import type { ContainerToken } from '../../Container';
import { useContainerRegistry } from '../../ContainerManagement/ContainerRegistryProvider';

type AnyRoute = RouteProp<ParamListBase, string>;

/**
 * Возвращает необязательную зависимость из контейнера текущего маршрута.
 *
 * При отсутствии зависимости возвращает undefined, не выбрасывая исключение.
 *
 * @template T Тип зависимости.
 * @param token Токен требуемой зависимости.
 * @returns Экземпляр зависимости или undefined.
 */
export default function useOptionalDependency<T>(token: ContainerToken<T>): T | undefined {
  const route = useRoute<AnyRoute>();
  const registry = useContainerRegistry();
  const routeKey = route.key;

  const container = useCreation(() => {
    return registry.get(routeKey) ?? registry.getRootContainer();
  }, [registry, routeKey]);

  return useCreation(() => {
    try {
      return container.get(token);
    } catch {
      return undefined;
    }
  }, [container, token, routeKey]);
}
