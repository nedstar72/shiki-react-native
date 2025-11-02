/**
 * Декоратор для геттеров, кэширующий результат первого вычисления.
 */
export function memo() {
  return function <This, Value>(
    originalGetter: (this: This) => Value,
    context: ClassGetterDecoratorContext<This, Value>,
  ) {
    if (context.kind !== 'getter') {
      throw new TypeError(`@memo можно применять только к геттерам`);
    }

    const { name } = context;

    return function (this: This): Value {
      const value = originalGetter.call(this);

      Object.defineProperty(this as unknown as object, name, {
        configurable: false,
        enumerable: true,
        writable: false,
        value,
      });

      return value;
    };
  };
}
