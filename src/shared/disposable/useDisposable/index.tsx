import { useRef, type DependencyList } from 'react';

import { isFunction, isLazyProxy } from '@/shared/utils/js';
import { useCreation, useUnmount } from '@/shared/utils/react';

import type { Disposable } from '../Disposable';

type Factory<T extends Disposable> = () => T;

const disposableHolders = new WeakMap<Disposable, number>();

/**
 * Регистрирует нового держателя `Disposable`, увеличивая число активных ссылок.
 *
 * @param disposable Освобождаемый ресурс, которым пользуется текущий компонент.
 */
function registerDisposableHolder(disposable: Disposable): void {
  const nextCount = (disposableHolders.get(disposable) ?? 0) + 1;
  disposableHolders.set(disposable, nextCount);
}

/**
 * Снимает держателя `Disposable` и инициирует освобождение ресурса, если держателей больше нет.
 *
 * @param disposable Освобождаемый ресурс, который перестаёт использоваться компонентом.
 */
function unregisterDisposableHolder(disposable: Disposable): void {
  const currentCount = disposableHolders.get(disposable);

  if (!currentCount) {
    return;
  }

  if (currentCount > 1) {
    disposableHolders.set(disposable, currentCount - 1);
    return;
  }

  disposableHolders.delete(disposable);
  disposable.dispose();
}

/**
 * Привязывает `Disposable` к жизненному циклу компонента и освобождает его при размонтировании.
 *
 * Принимает фабрику или готовый экземпляр. Если передан ленивый прокси, созданный `lazy`,
 * объект не интерпретируется как фабрика и возвращается как есть.
 *
 * @param factoryOrInstance Фабрика создания `Disposable` или готовый экземпляр.
 * @param deps Список зависимостей, при изменении которых пересоздается экземпляр.
 * @returns Экземпляр `Disposable`, отслеживаемый до размонтирования компонента.
 */
export default function useDisposable<T extends Disposable>(
  factoryOrInstance: Factory<T> | T,
  deps: DependencyList = [],
): T {
  const disposableRef = useRef<T | null>(null);

  const disposable = useCreation<T>(() => {
    const shouldInvokeFactory = isFunction(factoryOrInstance) && !isLazyProxy(factoryOrInstance);

    const nextDisposable = shouldInvokeFactory
      ? (factoryOrInstance as Factory<T>)()
      : (factoryOrInstance as T);

    const previousDisposable = disposableRef.current;

    if (previousDisposable && previousDisposable !== nextDisposable) {
      unregisterDisposableHolder(previousDisposable);
      disposableRef.current = null;
    }

    if (!previousDisposable || previousDisposable !== nextDisposable) {
      registerDisposableHolder(nextDisposable);
      disposableRef.current = nextDisposable;
    }

    return nextDisposable;
  }, deps);

  useUnmount(() => {
    if (disposableRef.current) {
      unregisterDisposableHolder(disposableRef.current);
    }

    disposableRef.current = null;
  });

  return disposable;
}
