import { useEffect } from 'react';

import useLatest from '../useLatest';

/**
 * Запускает переданную функцию при размонтировании компонента.
 *
 * @param fn Функция, выполняемая во время размонтирования компонента.
 */
export default function useUnmount(fn: () => void) {
  const fnRef = useLatest(fn);

  useEffect(() => {
    return () => fnRef();
  }, [fnRef]);
}
