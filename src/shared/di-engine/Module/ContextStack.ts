import { ResolutionContext } from 'inversify';

import DIEngineError from '../DIEngineError';

/**
 * Хранит стек активных DI-контекстов.
 *
 * Используется модулями для корректного разрешения зависимостей внутри `@provide` / `@resolve`.
 */
export class ContextStack<T extends ResolutionContext> {
  private readonly stack: T[] = [];

  /** Добавляет новый контекст в стек. */
  push(ctx: T): void {
    this.stack.push(ctx);
  }

  /** Убирает верхний контекст из стека. */
  pop(): void {
    if (this.stack.length === 0) {
      throw new DIEngineError('Стек контекстов пуст: нарушен баланс push/pop');
    }
    this.stack.pop();
  }

  /** Текущий активный контекст (верхний элемент стека). */
  get current(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  /** Проверка, пуст ли стек. */
  get isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /** Выполняет функцию внутри заданного контекста. */
  runWith<R>(ctx: T, fn: () => R): R {
    this.push(ctx);
    try {
      return fn();
    } finally {
      this.pop();
    }
  }

  /** Полная очистка стека. */
  clear(): void {
    this.stack.length = 0;
  }
}
