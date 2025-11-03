import { DependencyList, useRef } from 'react';

import { deepEqual } from '@/shared/utils/js';

export default function useDeepMemo<T>(factory: () => T, deps?: DependencyList): T {
  const ref = useRef<{ value: T; deps?: DependencyList } | null>(null);

  if (!ref.current || !deepEqual(deps, ref.current.deps)) {
    ref.current = { value: factory(), deps };
  }

  return ref.current.value;
}
