type LazyState<T> = {
  realized: boolean;
  value: T | undefined;
  proxy: T;
};

/**
 * Создает ленивый прокси для значения, вычисляемого по требованию.
 *
 * Значение вычисляется один раз при первом обращении и повторно используется при последующих доступах.
 *
 * @param factory Фабрика, создающая исходное значение.
 * @returns Прокси, обеспечивающий ленивое вычисление значения.
 */
export function lazy<T>(factory: () => T): T {
  const state: LazyState<T> = {
    realized: false,
    value: undefined,
    proxy: undefined as unknown as T,
  };

  const ensure = () => {
    if (!state.realized) {
      state.value = factory();
      state.realized = true;
    }
    return state.value as any;
  };

  const placeholder = function () {
    return ensure();
  } as unknown as object;

  state.proxy = new Proxy(placeholder, {
    get(_target, prop, receiver) {
      return Reflect.get(ensure(), prop, receiver);
    },
    set(_target, prop, value, receiver) {
      return Reflect.set(ensure(), prop, value, receiver);
    },
    has(_target, prop) {
      return Reflect.has(ensure(), prop);
    },
    ownKeys() {
      return Reflect.ownKeys(ensure());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(ensure(), prop);
    },
    apply(_target, thisArg, args) {
      return Reflect.apply(ensure(), thisArg, args);
    },
    construct(_target, args, newTarget) {
      return Reflect.construct(ensure(), args, newTarget);
    },
  }) as T;

  return state.proxy;
}

/**
 * Возвращает функцию, создающую ленивый прокси при каждом вызове.
 *
 * Обертка повторно использует фабрику, формируя независимые ленивые значения для каждого обращения.
 *
 * @param factory Фабрика, создающая исходное значение.
 * @returns Функция, формирующая ленивый прокси на основе исходной фабрики.
 */
export function lazyFactory<T>(factory: () => T): () => T {
  return () => lazy(factory);
}
