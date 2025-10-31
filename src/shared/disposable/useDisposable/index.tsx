import { useRef, type DependencyList } from 'react';

import { isFunction } from '@/shared/utils/js';
import { useCreation, useUnmount } from '@/shared/utils/react';

import type { Disposable } from '../Disposable';

type Factory<T extends Disposable> = () => T;

export default function useDisposable<T extends Disposable>(
  factoryOrInstance: Factory<T> | T,
  deps: DependencyList = [],
): T {
  const disposableRef = useRef<T | null>(null);

  const disposable = useCreation<T>(() => {
    const nextDisposable = isFunction(factoryOrInstance) ? factoryOrInstance() : factoryOrInstance;

    if (disposableRef.current && disposableRef.current !== nextDisposable) {
      disposableRef.current.dispose();
    }

    disposableRef.current = nextDisposable;

    return nextDisposable;
  }, deps);

  useUnmount(() => {
    disposableRef.current?.dispose();
    disposableRef.current = null;
  });

  return disposable;
}
