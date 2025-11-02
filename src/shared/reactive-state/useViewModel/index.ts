import { useDependency } from '@/shared/di-react-native';
import { useDisposable } from '@/shared/disposable';

import type { ViewModel } from '../ViewModel';

type ViewModelToken<T extends ViewModel<any, any>> = new (...args: any[]) => T;

export function useViewModel<T extends ViewModel<any, any>>(token: ViewModelToken<T>): T {
  const instance = useDependency(token);
  return useDisposable(instance);
}
