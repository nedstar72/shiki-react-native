import type { NavigationProp, ParamListBase, RouteProp } from '@react-navigation/native';

/**
 * Представляет токен для получения зависимостей из контейнера.
 */
export type Token<T> = string | symbol | Constructor<T> | AbstractConstructor<T>;

/**
 * Описывает контракт контейнера зависимостей.
 *
 * Контейнер отвечает за выдачу конкретных экземпляров по заданным токенам.
 */
export interface Container {
  /**
   * Возвращает зависимость по указанному токену.
   *
   * @throws Error Если зависимость не найдена в контейнере.
   */
  get<T>(token: Token<T>): T;

  /**
   * Возвращает зависимость по указанному токену или undefined, если зависимость не найдена.
   */
  getSafely<T>(token: Token<T>): T | undefined;
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
