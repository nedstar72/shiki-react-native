declare global {
  type EmptyObject = {};

  type UnknownObject = Record<PropertyKey, unknown>;

  type AbstractConstructor<T> = abstract new (...args: never[]) => T;
}

export {};
