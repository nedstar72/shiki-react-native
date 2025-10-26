import type { ComponentType } from 'react';

import useContainer from '../useContainer';

/**
 * Возвращает HOC, подключающий компонент к уже существующему контейнеру.
 *
 * Позволяет использовать родительский контейнер без создания нового экземпляра.
 */
export function withInheritedContainer(Component: ComponentType) {
  function WithInheritedContainer(props: UnknownObject) {
    useContainer();
    return <Component {...props} />;
  }

  WithInheritedContainer.displayName = `withInheritedContainer(${Component.displayName ?? Component.name ?? 'Component'})`;
  return WithInheritedContainer;
}
