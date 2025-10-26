import { EffectCallback, useEffect } from 'react';

import { isPromise } from '@/shared/utils/js';

import useLatest from '../useLatest';

type MountCallback = EffectCallback | (() => PromiseLike<void | (() => void)>);

/**
 * Выполняет переданную функцию один раз при монтировании компонента.
 *
 * @param fn Функция, вызываемая при монтировании компонента.
 */
export default function useMount(fn: MountCallback): void {
  const fnRef = useLatest(fn);

  useEffect(() => {
    const result = fnRef();
    // If fn returns a Promise, don't return it as cleanup function
    if (isPromise(result)) {
      return;
    }
    return result;
  }, [fnRef]);
}
