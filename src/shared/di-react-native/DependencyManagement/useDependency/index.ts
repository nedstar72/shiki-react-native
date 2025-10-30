import { isString, isSymbol } from '@/shared/utils/js';
import { useLazyCreation } from '@/shared/utils/react';

import type { Token } from '../../Container';
import { useContainer } from '../../ContainerManagement';

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
  const container = useContainer();

  const dependency = useLazyCreation(() => {
    try {
      return container.get(token);
    } catch {
      throw new Error(`Dependency "${tokenToString(token)}" is missing`);
    }
  }, [container, token]);

  return dependency;
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
