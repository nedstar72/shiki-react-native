import {
  useNavigation,
  useRoute,
  type NavigationAction,
  type NavigationProp,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  type RouteProp,
} from '@react-navigation/native';

import { isArray, isObject, isString } from '@/shared/utils/js';
import { useLazyCreation } from '@/shared/utils/react';

type AnyNavigation = NavigationProp<ParamListBase, string>;
type AnyRoute = RouteProp<ParamListBase, string>;

type NavigationWithPush = AnyNavigation & { push: (...args: any[]) => unknown };
type NavigationWithReplace = AnyNavigation & { replace: (...args: any[]) => unknown };

export const SOURCE_PARAM_KEY = '@navigation/source';

/**
 * Возвращает обертку над навигацией, добавляющую идентификатор источника в маршруты.
 *
 * Обогащает вызовы navigate, dispatch, push и replace данными о текущем маршруте.
 */
export function useTrailNavigation<
  TNavigation extends AnyNavigation = AnyNavigation,
>(): TNavigation {
  const navigation = useNavigation<TNavigation>();
  const route = useRoute<AnyRoute>();

  return useLazyCreation(
    () => createTrailNavigation(navigation, route.key),
    [navigation, route.key],
  );
}

/**
 * Создаёт обёрнутую навигацию с добавлением source в маршруты и экшены.
 *
 * Добавляет новые реализации методов, учитывающих источник перехода.
 */
function createTrailNavigation<TNavigation extends AnyNavigation>(
  navigation: TNavigation,
  sourceKey: string,
): TNavigation {
  const trailNavigation: TNavigation = {
    ...navigation,
    navigate: createNavigateWrapper(navigation, sourceKey),
    dispatch: createDispatchWrapper(navigation, sourceKey),
  };

  if (hasPush(navigation)) {
    (trailNavigation as NavigationWithPush).push = createPushWrapper(
      navigation as NavigationWithPush,
      sourceKey,
    );
  }

  if (hasReplace(navigation)) {
    (trailNavigation as NavigationWithReplace).replace = createReplaceWrapper(
      navigation as NavigationWithReplace,
      sourceKey,
    );
  }

  return trailNavigation;
}

/**
 * Создаёт адаптер для метода navigate с добавлением source.
 *
 * Поддерживает строковые и объектные сигнатуры вызова.
 */
function createNavigateWrapper(navigation: AnyNavigation, sourceKey: string) {
  return function navigate(...args: unknown[]) {
    if (isString(args[0])) {
      const [name, params, options] = args as [
        string,
        Record<string, unknown> | undefined,
        Record<string, unknown> | undefined,
      ];
      return navigation.navigate(
        name,
        augmentParams(params, sourceKey) as object | undefined,
        options as { merge?: boolean; pop?: boolean } | undefined,
      );
    }

    if (isObject(args[0])) {
      const [payload] = args as [Record<string, unknown>];
      return navigation.navigate({
        ...payload,
        params: augmentParams(payload.params, sourceKey) as object | undefined,
      } as Parameters<AnyNavigation['navigate']>[0]);
    }

    return navigation.navigate(...(args as Parameters<AnyNavigation['navigate']>));
  };
}

/**
 * Создаёт адаптер для метода push с добавлением source.
 *
 * Поддерживает строковые и объектные сигнатуры вызова.
 */
function createPushWrapper(navigation: NavigationWithPush, sourceKey: string) {
  return function push(...args: unknown[]) {
    if (isString(args[0])) {
      const [name, params] = args as [string, Record<string, unknown> | undefined];
      return navigation.push(name, augmentParams(params, sourceKey) as object | undefined);
    }

    if (isObject(args[0])) {
      const [payload] = args as [Record<string, unknown>];
      return navigation.push({
        ...payload,
        params: augmentParams(payload.params, sourceKey) as object | undefined,
      } as Parameters<NavigationWithPush['push']>[0]);
    }

    return navigation.push(...(args as Parameters<NavigationWithPush['push']>));
  };
}

/**
 * Создаёт адаптер для метода replace с добавлением source.
 *
 * Поддерживает строковые и объектные сигнатуры вызова.
 */
function createReplaceWrapper(navigation: NavigationWithReplace, sourceKey: string) {
  return function replace(...args: unknown[]) {
    if (isString(args[0])) {
      const [name, params] = args as [string, Record<string, unknown> | undefined];
      return navigation.replace(name, augmentParams(params, sourceKey) as object | undefined);
    }

    if (isObject(args[0])) {
      const [payload] = args as [Record<string, unknown>];
      return navigation.replace({
        ...payload,
        params: augmentParams(payload.params, sourceKey) as object | undefined,
      } as Parameters<NavigationWithReplace['replace']>[0]);
    }

    return navigation.replace(...(args as Parameters<NavigationWithReplace['replace']>));
  };
}

/**
 * Создаёт адаптер для dispatch с рекурсивным добавлением source.
 *
 * Поддерживает вложенные состояния и экшены.
 */
function createDispatchWrapper(navigation: AnyNavigation, sourceKey: string) {
  return function dispatch(action: NavigationAction) {
    return navigation.dispatch(augmentAction(action, sourceKey));
  };
}

/**
 * Дополняет экшен навигации идентификатором источника.
 *
 * Рекурсивно обрабатывает параметры, маршруты, вложенные экшены и состояние.
 */
function augmentAction(action: NavigationAction, sourceKey: string): NavigationAction {
  if (!isObject(action)) {
    return action;
  }

  const payload = action.payload;

  if (!isObject(payload)) {
    return action;
  }

  return {
    ...action,
    payload: {
      ...payload,
      params: 'params' in payload ? augmentParams(payload.params, sourceKey) : payload.params,
      routes: isArray(payload.routes)
        ? payload.routes.map(route => augmentRoute(route, sourceKey))
        : payload.routes,
      actions: isArray<any>(payload.actions)
        ? payload.actions.map(act => augmentAction(act, sourceKey))
        : payload.actions,
      state: 'state' in payload ? augmentState(payload.state as any, sourceKey) : payload.state,
    },
  } as NavigationAction;
}

/**
 * Обновляет состояние навигации, добавляя source во вложенные маршруты.
 */
function augmentState<
  TState extends
    | NavigationState<ParamListBase>
    | PartialState<NavigationState<ParamListBase>>
    | undefined,
>(state: TState, sourceKey: string): TState {
  if (!isObject(state)) {
    return state;
  }

  const routes = isArray(state.routes)
    ? state.routes.map(route => augmentRoute(route, sourceKey))
    : state.routes;

  return {
    ...state,
    routes,
  } as TState;
}

/**
 * Обновляет описание маршрута, добавляя идентификатор источника.
 *
 * Рекурсивно обрабатывает параметры и дочерние состояния.
 */
function augmentRoute<TRoute>(route: TRoute, sourceKey: string): TRoute {
  if (!isObject(route)) {
    return route;
  }

  const next = {
    ...route,
    params: augmentParams(route.params, sourceKey),
    state: augmentState(route.state as any, sourceKey),
  };

  return next as TRoute;
}

/**
 * Дополняет объект параметров маршрута идентификатором источника.
 *
 * Поддерживает вложенные параметры, состояния и маршруты.
 */
function augmentParams<T>(params: T, sourceKey: string): T {
  if (params == null) {
    return { [SOURCE_PARAM_KEY]: sourceKey } as T;
  }

  if (!isObject(params)) {
    return params;
  }

  const next: Record<string, unknown> = {
    ...params,
    [SOURCE_PARAM_KEY]: sourceKey,
  };

  if ('params' in next) {
    next.params = augmentParams(next.params, sourceKey);
  }

  if ('state' in next) {
    next.state = augmentState(next.state as any, sourceKey);
  }

  if ('routes' in next && isArray(next.routes)) {
    next.routes = next.routes.map(route => augmentRoute(route, sourceKey));
  }

  return next as T;
}

/**
 * Проверяет наличие метода push у навигации.
 */
function hasPush(navigation: AnyNavigation): navigation is NavigationWithPush {
  return typeof (navigation as NavigationWithPush).push === 'function';
}

/**
 * Проверяет наличие метода replace у навигации.
 */
function hasReplace(navigation: AnyNavigation): navigation is NavigationWithReplace {
  return typeof (navigation as NavigationWithReplace).replace === 'function';
}
