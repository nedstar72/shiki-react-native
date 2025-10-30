import type { ParamListBase, RouteProp } from '@react-navigation/native';

import { isNotDefined, isObject, isString } from '@/shared/utils/js';

import { SOURCE_PARAM_KEY } from './useTrailNavigation';

type AnyRoute = RouteProp<ParamListBase, string>;

/**
 * Извлекает идентификатор источника из параметров маршрута.
 *
 * Возвращает ключ родительского маршрута, если он передан в параметрах.
 */
export function extractSource(route: AnyRoute): string | undefined {
  const params = route.params;
  if (isNotDefined(params) || !isObject(params)) {
    return undefined;
  }

  const source = params[SOURCE_PARAM_KEY];
  return isString(source) ? source : undefined;
}
