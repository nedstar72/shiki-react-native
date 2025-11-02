/**
 * Декоратор методов, автоматически биндящий `this` на экземпляр.
 */
export function bind() {
  return function <This, A extends unknown[], R>(
    originalMethod: (this: This, ...args: A) => R,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: A) => R>,
  ) {
    if (context.kind !== 'method') {
      throw new TypeError(`@bind можно применять только к методам`);
    }

    if (context.static) {
      throw new TypeError(`@bind не поддерживает статические методы`);
    }

    const { name } = context;

    context.addInitializer(function (this: This) {
      // Если по какой-то причине уже есть own-свойство — не перезаписываем.
      if (Object.prototype.hasOwnProperty.call(this, name)) {
        return;
      }

      const bound = originalMethod.bind(this);
      this[name as keyof This] = bound as This[keyof This];
    });

    // Возвращаем "оригинальную" функцию — она почти не будет вызываться,
    // потому что на инстансе мы положим bound-функцию. Но если вдруг вызов
    // пойдёт через прототип ДО init (теоретически), оставим корректное поведение.
    return function (this: This, ...args: A): R {
      return originalMethod.apply(this, args);
    } as any;
  };
}
