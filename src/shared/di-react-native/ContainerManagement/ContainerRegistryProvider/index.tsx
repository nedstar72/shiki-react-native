import { createContext, useContext, type PropsWithChildren } from 'react';

import { useCreation, useLatest } from '@/shared/utils/react';

import type { Container } from '../../Container';

/**
 * Описывает набор операций для работы с реестром контейнеров.
 *
 * Реестр управляет жизненным циклом контейнеров, связанных с навигационными маршрутами.
 */
export interface ContainerRegistry {
  /**
   * Возвращает контейнер по ключу маршрута.
   *
   * @param key Идентификатор маршрута.
   * @returns Контейнер, если он зарегистрирован.
   */
  get(key: string): Container | undefined;

  /**
   * Сохраняет контейнер в реестре по ключу маршрута.
   *
   * @param key Идентификатор маршрута.
   * @param container Экземпляр контейнера.
   */
  register(key: string, container: Container): void;

  /**
   * Удаляет контейнер из реестра по ключу маршрута.
   *
   * @param key Идентификатор маршрута.
   */
  unregister(key: string): void;

  /**
   * Возвращает корневой контейнер приложения.
   *
   * @returns Экземпляр корневого контейнера.
   */
  getRootContainer(): Container;
}

export interface ContainerRegistryProviderProps extends PropsWithChildren {
  rootContainer: Container;
}

const ContainerRegistryContext = createContext<ContainerRegistry | null>(null);

export function ContainerRegistryProvider({
  rootContainer,
  children,
}: ContainerRegistryProviderProps) {
  const containers = useCreation(() => new Map<string, Container>());
  const rootContainerRef = useLatest(rootContainer);

  const registry = useCreation<ContainerRegistry>(
    () => ({
      get(key) {
        return containers.get(key);
      },
      register(key, container) {
        containers.set(key, container);
      },
      unregister(key) {
        containers.delete(key);
      },
      getRootContainer() {
        return rootContainerRef;
      },
    }),
    [containers, rootContainerRef],
  );

  return (
    <ContainerRegistryContext.Provider value={registry}>
      {children}
    </ContainerRegistryContext.Provider>
  );
}

/**
 * Возвращает реестр контейнеров.
 */
export function useContainerRegistry(): ContainerRegistry {
  const context = useContext(ContainerRegistryContext);

  if (!context) {
    throw new Error('ContainerRegistryProvider is missing in the component tree');
  }

  return context;
}
