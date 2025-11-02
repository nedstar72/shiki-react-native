import { Observable, Subject } from 'rxjs';
import { observable, reaction, runInAction } from 'mobx';

import { DisposableBag, type Disposable } from '@/shared/disposable';
import { bind, memo } from '@/shared/utils/js';
import { toStream } from '@/shared/utils/mobx';

import { ReducerBuilder, ReducerMap, type State, type Action } from '../ReducerBuilder';

export class ViewModel<S extends State, A extends Action> implements Disposable {
  #state: S;

  private readonly bag = new DisposableBag();
  private readonly actionSubject = new Subject<Readonly<A>>();
  private readonly reducers: ReducerMap<S, A> = new Map();

  get state(): Readonly<S> {
    return this.#state;
  }

  @memo()
  get $state(): Observable<Readonly<S>> {
    const { observable: $state, disposer } = toStream(this.#state, {
      trackMode: 'deep',
      fireImmediately: true,
    });
    this.bag.add(disposer);
    return $state;
  }

  @memo()
  get $action(): Observable<Readonly<A>> {
    return this.actionSubject.asObservable();
  }

  constructor(initialState: S) {
    this.#state = observable(initialState);

    this.configureReducer();
  }

  private configureReducer(): void {
    const builder = new ReducerBuilder<S, A>();
    this.buildReducer(builder);
    const map = builder.build();

    for (const [type, reducer] of map.entries()) {
      if (this.reducers.has(type)) {
        throw new Error(`Редьюсер для "${type}" уже существует`);
      }
      this.reducers.set(type, reducer);
    }

    const subscription = this.$action.subscribe(action => {
      const reducer = this.reducers.get(action.type);
      if (!reducer) {
        return;
      }

      runInAction(() => {
        reducer(this.#state, action);
      });
    });

    this.bag.add(() => subscription.unsubscribe());
  }

  protected buildReducer(_builder: ReducerBuilder<S, A>): void {
    // Default implementation intentionally left blank.
  }

  protected registerDisposable(disposable: Disposable | (() => void)): void {
    this.bag.add(disposable);
  }

  @bind()
  dispatch(action: A): void {
    this.actionSubject.next(action);
  }

  @bind()
  select<R>(
    selector: (state: Readonly<S>) => R,
    options?: { fireImmediately?: boolean },
  ): Observable<R> {
    return new Observable<R>(subscriber => {
      const disposeReaction = reaction(
        () => selector(this.#state),
        value => subscriber.next(value),
        { fireImmediately: options?.fireImmediately ?? false },
      );

      return () => {
        disposeReaction();
        subscriber.complete();
      };
    });
  }

  @bind()
  dispose(): void {
    this.actionSubject.complete();
    this.bag.dispose();
  }
}
