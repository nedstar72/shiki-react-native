import { useDependency } from '@/shared/di-react-native';
import { useDisposable } from '@/shared/disposable';

import type { ViewModel } from '../ViewModel';

type ViewModelToken<T extends ViewModel<any, any>> = Constructor<T>;

/**
 * Разрешает ViewModel из контейнера зависимостей и привязывает её к жизненному циклу компонента.
 *
 * @param token Конструктор ViewModel, зарегистрированный в DI-контейнере.
 * @returns Экземпляр ViewModel, подготовленный к использованию в компоненте.
 */
export function useViewModel<T extends ViewModel<any, any>>(token: ViewModelToken<T>): T {
  const instance = useDependency(token);
  return useDisposable(instance);
}
