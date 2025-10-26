import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';

/**
 * Представляет токен для получения зависимостей из контейнера.
 */
export type ContainerToken<T> = AbstractConstructor<T> | string;

/**
 * Описывает контракт контейнера зависимостей.
 *
 * Контейнер отвечает за выдачу конкретных экземпляров по заданным токенам.
 */
export interface Container {
  /**
   * Возвращает зависимость по указанному токену.
   */
  get<T>(token: ContainerToken<T>): T;
}

/**
 * Используется для передачи контекста навигации при создании контейнеров.
 */
export interface NavigationContext<
  TParamList extends ParamListBase = ParamListBase,
  TRouteName extends keyof TParamList = string,
> {
  navigation: NavigationProp<TParamList, TRouteName>;
  route?: RouteProp<TParamList, TRouteName>;
}

/**
 * Определяет конструктор контейнера зависимостей для конкретного маршрута.
 */
export type ContainerConstructor<
  TContainer extends Container,
  TParamList extends ParamListBase = ParamListBase,
  TRouteName extends keyof TParamList = string,
> = new (
  parent?: Container | null,
  params?: unknown,
  navigation?: NavigationContext<TParamList, TRouteName>,
) => TContainer;
