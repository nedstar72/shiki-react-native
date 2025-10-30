import type { ComponentType } from 'react';

import type { Container, ContainerConstructor } from '../../Container';
import { ContainerProvider } from '../ContainerContext';

/**
 * Возвращает HOC, подключающий контейнер к текущему маршруту навигации.
 *
 * Создаёт контейнер при монтировании и обеспечивает доступ зависимостей через реестр.
 */
export function withContainer<T extends Container>(ContainerClass: ContainerConstructor<T>) {
  return (Component: ComponentType) => {
    function WithContainer(props: UnknownObject) {
      return (
        <ContainerProvider containerClass={ContainerClass}>
          <Component {...props} />
        </ContainerProvider>
      );
    }

    WithContainer.displayName = `withContainer(${Component.displayName ?? Component.name ?? 'Component'})`;
    return WithContainer;
  };
}
