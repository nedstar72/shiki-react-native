declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  type EmptyObject = {};

  type UnknownObject = Record<PropertyKey, unknown>;
}

export {};
