import { Observable, Subject } from 'rxjs';
import { observable, reaction, runInAction } from 'mobx';

import { DisposableBag, type Disposable } from '@/shared/disposable';
import { bind, memo } from '@/shared/utils/js';
import { toStream } from '@/shared/utils/mobx';

import {
  ReducerBuilder,
  ReducerMap,
  type ActionPayload,
  type Actions,
  type ActionType,
  type State,
} from '../ReducerBuilder';

/**
 * Событие, публикуемое ViewModel при получение экшена.
 */
export type ViewModelAction<A extends Actions, T extends ActionType<A> = ActionType<A>> = {
  type: T;
} & (undefined extends A[T] ? { payload?: ActionPayload<A, T> } : { payload: ActionPayload<A, T> });

type DispatchArguments<A extends Actions, T extends ActionType<A>> = undefined extends A[T]
  ? [payload?: ActionPayload<A, T>]
  : [payload: ActionPayload<A, T>];

/**
 * Базовый класс для построения ViewModel.
 */
export class ViewModel<S extends State, A extends Actions> implements Disposable {
  #state: S;

  private readonly bag = new DisposableBag();
  private readonly actionSubject = new Subject<ViewModelAction<any, any>>();
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
  get $action(): Observable<ViewModelAction<A>> {
    return this.actionSubject.asObservable() as Observable<ViewModelAction<A>>;
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

    const subscription = this.$action.subscribe(event => {
      const reducer = this.reducers.get(event.type);
      if (!reducer) {
        return;
      }

      const payload = 'payload' in event ? event.payload : undefined;

      runInAction(() => {
        reducer(this.#state, payload as ActionPayload<A, typeof event.type>);
      });
    });

    this.bag.add(() => subscription.unsubscribe());
  }

  /**
   * Переопределяется наследниками для регистрации редьюсеров.
   *
   * @param builder Построитель редьюсеров, предоставляемый базовым классом.
   */
  protected buildReducer(_builder: ReducerBuilder<S, A>): void {
    // Реализацию предоставляет наследник.
  }

  /**
   * Регистрирует внешний disposable в жизненном цикле ViewModel.
   *
   * @param disposable Объект или функция очистки, которую необходимо вызвать при dispose.
   */
  protected registerDisposable(disposable: Disposable | (() => void)): void {
    this.bag.add(disposable);
  }

  /**
   * Отправляет действие в поток ViewModel.
   *
   * @param type Имя действия.
   * @param payloadArgs Payload действия.
   */
  @bind()
  dispatch<T extends ActionType<A>>(type: T, ...payloadArgs: DispatchArguments<A, T>): void {
    const [payload] = payloadArgs;
    const event = (payloadArgs.length > 0 ? { type, payload } : { type }) as ViewModelAction<A, T>;

    this.actionSubject.next(event as ViewModelAction<A>);
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
