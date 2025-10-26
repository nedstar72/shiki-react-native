import { useRef } from 'react';

/**
 * Возвращает актуальное значение без потери ссылки между рендерами.
 *
 * Значение сохраняется во внутреннем ref, что позволяет использовать последнюю версию внутри замыканий без зависимостей.
 *
 * @param value Значение, которое требуется отслеживать между рендерами.
 * @returns Последнее сохраненное значение.
 */
export default function useLatest<T>(value: T): T {
  const ref = useRef(value);
  ref.current = value;
  return ref.current;
}
