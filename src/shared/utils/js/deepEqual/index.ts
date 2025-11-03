/**
 * Выполняет глубокое сравнение двух массивов на равенство.
 *
 * Логика сравнения:
 * - Если массивы идентичны по ссылке — `true`.
 * - Если длины различаются — `false`.
 * - Иначе глубоко сравнивается каждый элемент.
 *
 * @param lhs - Первый массив.
 * @param rhs - Второй массив.
 * @returns `true`, если массивы равны по глубокому сравнению, иначе `false`.
 */
function deepEqualArrays(lhs: unknown[], rhs: unknown[]): boolean {
  if (lhs === rhs) {
    return true;
  }

  if (lhs.length !== rhs.length) {
    return false;
  }

  for (let i = 0; i < lhs.length; i++) {
    if (!deepEqual(lhs[i], rhs[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Выполняет глубокое сравнение двух объектов на равенство.
 *
 * Логика сравнения:
 * - Если объекты идентичны по ссылке — `true`.
 * - Если число ключей различается — `false`.
 * - Иначе глубоко сравнивается значение каждого ключа.
 *
 * @param lhs - Первый объект.
 * @param rhs - Второй объект.
 * @returns `true`, если объекты равны по глубокому сравнению, иначе `false`.
 */
function deepEqualObjects(lhs: Record<string, unknown>, rhs: Record<string, unknown>): boolean {
  if (lhs === rhs) {
    return true;
  }

  const lKeys = Object.keys(lhs);
  const rKeys = Object.keys(rhs);

  if (lKeys.length !== rKeys.length) {
    return false;
  }

  for (const key of lKeys) {
    if (!Object.prototype.hasOwnProperty.call(rhs, key)) {
      return false;
    }
    if (!deepEqual(lhs[key], rhs[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Глубоко сравнивает два значения на эквивалентность.
 *
 * Алгоритм сравнения:
 * 1. **Ссылочное равенство**: если `lhs === rhs`, возвращается `true`.
 * 2. **Null/undefined**: если хотя бы одно из значений — `null` или `undefined`,
 *    сравниваются напрямую (`===`), чтобы не переходить к дальнейшей логике.
 * 3. **Date**: если оба значения — экземпляры `Date`, сравниваются их метки времени (`.getTime()`).
 * 4. **RegExp**: если оба значения — экземпляры `RegExp`, сравниваются их строковые представления.
 * 5. **Массивы**:
 *    - Проверяется, что оба значения — массивы (`Array.isArray`).
 *    - Если да, сравниваются длины и каждый элемент рекурсивно через `deepEqual`.
 * 6. **Обычные объекты**:
 *    - Проверяется, что оба значения — объекты (`typeof === 'object'` и не `null`).
 *    - Сравнивается количество собственных ключей.
 *    - Для каждого ключа проверяется его наличие в обоих объектах и эквивалентность значений через рекурсивный вызов `deepEqual`.
 * 7. **Все остальные случаи** (примитивы, функции и т.п.): применяется строгое равенство (`===`).
 *
 * Таким образом, функция позволяет корректно обрабатывать вложенные структуры,
 * автоматом «спускаясь» внутрь массивов и объектов, а также учитывает специальные
 * стандартные типы (`Date`, `RegExp`).
 *
 * @param lhs - Первое сравниваемое значение.
 * @param rhs - Второе сравниваемое значение.
 * @returns `true`, если значения равны с учётом глубокой структуры, иначе `false`.
 */
export function deepEqual(lhs: unknown, rhs: unknown): boolean {
  if (lhs === rhs) {
    return true;
  }

  if (lhs === undefined || lhs === null || rhs === undefined || rhs === null) {
    return lhs === rhs;
  }

  if (lhs instanceof Date && rhs instanceof Date) {
    return lhs.getTime() === rhs.getTime();
  }

  if (lhs instanceof RegExp && rhs instanceof RegExp) {
    return lhs.toString() === rhs.toString();
  }

  const lhsIsArray = Array.isArray(lhs);
  const rhsIsArray = Array.isArray(rhs);
  if (lhsIsArray || rhsIsArray) {
    if (lhsIsArray !== rhsIsArray) {
      return false;
    }
    return deepEqualArrays(lhs as unknown[], rhs as unknown[]);
  }

  const lhsIsObject = typeof lhs === 'object' && lhs !== null;
  const rhsIsObject = typeof rhs === 'object' && rhs !== null;
  if (lhsIsObject && rhsIsObject) {
    return deepEqualObjects(lhs as Record<string, unknown>, rhs as Record<string, unknown>);
  }

  return lhs === rhs;
}
