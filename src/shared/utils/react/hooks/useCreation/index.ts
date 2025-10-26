import { type DependencyList, useRef } from 'react';

import { shallowCompareDeps } from '../../helpers';

const EMPTY_DEPS: DependencyList = [];

/**
 * Создает и сохраняет значение на основании фабрики и зависимостей.
 *
 * Повторный вызов фабрики выполняется только при первом рендере или при изменении списка зависимостей.
 *
 * @param factory Функция, создающая новое значение.
 * @param deps Список зависимостей, отслеживаемых для пересоздания значения. По-умолчанию пустой массив.
 * @returns Созданное значение, сохраненное между вызовами хука.
 */
export default function useCreation<T>(factory: () => T, deps: DependencyList = EMPTY_DEPS): T {
  const { current } = useRef({
    deps,
    obj: undefined as T,
    initialized: false,
  });
  if (current.initialized === false || !shallowCompareDeps(current.deps, deps)) {
    current.deps = deps;
    current.obj = factory();
    current.initialized = true;
  }
  return current.obj;
}
