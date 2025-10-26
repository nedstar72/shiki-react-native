import type { DependencyList } from 'react';

/**
 * Выполняет поверхностное сравнение двух списков зависимостей.
 *
 * Сравнение соответствует правилам React и использует Object.is для каждой позиции массивов, что позволяет выявлять изменения ссылок либо примитивов.
 *
 * @param prevDeps Предыдущий список зависимостей.
 * @param nextDeps Актуальный список зависимостей.
 * @returns Булево значение, отражающее совпадение списков по ссылке или по значениям элементов.
 */
export default function shallowCompareDeps(
  prevDeps: DependencyList,
  nextDeps: DependencyList,
): boolean {
  if (prevDeps === nextDeps) {
    return true;
  }
  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return false;
    }
  }
  return true;
}
