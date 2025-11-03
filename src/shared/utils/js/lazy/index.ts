type LazyState<T> = {
  realized: boolean;
  value: T | undefined;
  proxy: T;
};

const LAZY_PROXY_FLAG = Symbol('lazyProxy');

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
  } as unknown as Record<symbol, boolean>;

  Object.defineProperty(placeholder, LAZY_PROXY_FLAG, {
    value: true,
    enumerable: false,
    configurable: false,
  });

  state.proxy = new Proxy(placeholder, {
    get(target, prop, receiver) {
      if (prop === LAZY_PROXY_FLAG) {
        return true;
      }
      const value = ensure();
      if (!Object.prototype.hasOwnProperty.call(target, prop)) {
        const descriptor = Reflect.getOwnPropertyDescriptor(value, prop);
        if (descriptor) {
          Object.defineProperty(target, prop, descriptor);
        }
      }
      return Reflect.get(value, prop, receiver);
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
    getOwnPropertyDescriptor(target, prop) {
      const descriptor = Reflect.getOwnPropertyDescriptor(ensure(), prop);
      if (descriptor && !Reflect.has(target, prop)) {
        Object.defineProperty(target, prop, descriptor);
      }
      return descriptor;
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

/**
 * Проверяет, является ли значение ленивым прокси, созданным функцией {@link lazy}.
 *
 * Маркер используется для предотвращения ошибочного трактования прокси как вызываемой фабрики.
 *
 * @param value Проверяемое значение.
 * @returns `true`, если значение создано через {@link lazy}.
 */
export function isLazyProxy(value: unknown): value is object {
  if (value === null || (typeof value !== 'object' && typeof value !== 'function')) {
    return false;
  }

  return Boolean(Reflect.get(value, LAZY_PROXY_FLAG));
}
