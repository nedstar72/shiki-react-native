declare global {
  type EmptyObject = {};

  type UnknownObject = Record<PropertyKey, unknown>;

  type Constructor<T> = new (...args: any[]) => T;

  type AbstractConstructor<T> = abstract new (...args: never[]) => T;
}

export {};
