import type { ComponentType } from 'react';

import type { Container, ContainerConstructor } from '../../Container';
import useContainer from '../useContainer';

/**
 * Возвращает HOC, подключающий контейнер к текущему маршруту навигации.
 *
 * Создаёт контейнер при монтировании и обеспечивает доступ зависимостей через реестр.
 */
export function withContainer<T extends Container>(ContainerClass: ContainerConstructor<T>) {
  return (Component: ComponentType) => {
    function WithContainer(props: UnknownObject) {
      useContainer(ContainerClass);
      return <Component {...props} />;
    }

    WithContainer.displayName = `withContainer(${Component.displayName ?? Component.name ?? 'Component'})`;
    return WithContainer;
  };
}
