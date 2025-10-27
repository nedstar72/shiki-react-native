import { useRoute, type RouteProp, type ParamListBase } from '@react-navigation/native';

import { isString, isSymbol } from '@/shared/utils/js';
import { useLazyCreation } from '@/shared/utils/react';

import type { Token } from '../../Container';
import { useContainerRegistry } from '../../ContainerManagement/ContainerRegistryProvider';

type AnyRoute = RouteProp<ParamListBase, string>;

/**
 * Возвращает обязательную зависимость из контейнера текущего маршрута.
 *
 * При отсутствии зависимости возбуждает ошибку с подробным описанием.
 *
 * @template T Тип зависимости.
 * @param token Токен требуемой зависимости.
 * @returns Экземпляр зависимости.
 * @throws Error Если зависимость не найдена в контейнере.
 */
export default function useDependency<T>(token: Token<T>): T {
  const route = useRoute<AnyRoute>();
  const registry = useContainerRegistry();
  const routeKey = route.key;

  const container = useLazyCreation(() => {
    return registry.get(routeKey) ?? registry.getRootContainer();
  }, [registry, routeKey]);

  const dependency = useLazyCreation(() => {
    try {
      return container.get(token);
    } catch (error) {
      throw enhanceError(error, token, routeKey);
    }
  }, [container, token, routeKey]);

  if (dependency === undefined) {
    throw new Error(`Dependency "${tokenToString(token)}" is missing for route "${routeKey}"`);
  }

  return dependency;
}

/**
 * Дополняет ошибку информацией о токене и маршруте.
 *
 * @param error Исходная ошибка.
 * @param token Токен зависимости.
 * @param routeKey Ключ текущего маршрута.
 * @returns Обновлённая ошибка.
 */
function enhanceError(error: unknown, token: Token<unknown>, routeKey: string): Error {
  if (error instanceof Error) {
    if (!error.message) {
      error.message = `Failed to resolve dependency "${tokenToString(token)}" for route "${routeKey}"`;
    }
    return error;
  }

  return new Error(
    `Failed to resolve dependency "${tokenToString(token)}" for route "${routeKey}"`,
  );
}

/**
 * Преобразует токен в строковое представление для сообщения об ошибке.
 *
 * @param token Токен зависимости.
 * @returns Человекочитаемое представление токена.
 */
function tokenToString(token: Token<unknown>): string {
  if (isString(token)) {
    return token;
  }
  if (isSymbol(token)) {
    return token.toString();
  }
  return token.name || '<anonymous>';
}
