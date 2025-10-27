import { type DependencyList } from 'react';

import { lazyFactory } from '@/shared/utils/js';

import useCreation from '../useCreation';

const EMPTY_DEPS: DependencyList = [];

/**
 * Лениво создает и сохраняет значение на основании фабрики и зависимостей.
 *
 * Повторный вызов фабрики выполняется только при первом рендере или при изменении списка зависимостей.
 *
 * @param factory Функция, создающая новое значение.
 * @param deps Список зависимостей, отслеживаемых для пересоздания значения. По-умолчанию пустой массив.
 * @returns Созданное значение, сохраненное между вызовами хука.
 */
export default function useLazyCreation<T>(factory: () => T, deps: DependencyList = EMPTY_DEPS): T {
  return useCreation(lazyFactory(factory), deps);
}
