import { useCreation } from '@/shared/utils/react';

import type { Token } from '../../Container';
import { useContainer } from '../../ContainerManagement';

/**
 * Возвращает необязательную зависимость из контейнера.
 *
 * При отсутствии зависимости возвращает undefined, не выбрасывая исключение.
 *
 * @template T Тип зависимости.
 * @param token Токен требуемой зависимости.
 * @returns Экземпляр зависимости или undefined.
 */
export default function useOptionalDependency<T>(token: Token<T>): T | undefined {
  const container = useContainer();

  return useCreation(() => {
    return container.getSafely(token);
  }, [container, token]);
}
