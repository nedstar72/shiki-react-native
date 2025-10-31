import { isFunction, isNotDefined } from '@/shared/utils/js';

import { type Disposable } from '../Disposable';

type DisposableLike = Disposable | (() => void);

export default class DisposableBag implements Disposable {
  #storage = new Map<DisposableLike, Disposable>();
  #disposed = false;

  get size(): number {
    return this.#storage.size;
  }

  get isDisposed(): boolean {
    return this.#disposed;
  }

  constructor(initial: DisposableLike[] = []) {
    initial.slice().forEach(item => this.add(item));
  }

  add(item: DisposableLike): this {
    if (isNotDefined(item)) {
      return this;
    }

    if (this.#disposed) {
      toDisposable(item).dispose();
      return this;
    }

    if (!this.#storage.has(item)) {
      this.#storage.set(item, toDisposable(item));
    }

    return this;
  }

  delete(item: DisposableLike): boolean {
    return this.#storage.delete(item);
  }

  dispose(): void {
    if (this.#disposed) {
      return;
    }
    this.#disposed = true;

    const disposables = Array.from(this.#storage.values()).reverse();
    const errors: unknown[] = [];

    this.#storage.clear();

    disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        errors.push(error);
      }
    });

    if (errors.length === 1) {
      throw errors[0];
    }

    if (errors.length > 1) {
      throw new AggregateError(errors, 'Failed to dispose DisposableBag');
    }
  }
}

function toDisposable(input: DisposableLike): Disposable {
  if (isFunction(input)) {
    let disposed = false;

    return {
      dispose() {
        if (disposed) {
          return;
        }
        disposed = true;
        input();
      },
    };
  }

  return input;
}
