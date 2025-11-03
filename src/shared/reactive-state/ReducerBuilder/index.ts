import type { Actions, ActionPayload, ActionType, State } from '../Core';

/**
 * Набор параметров для редьюсера.
 *
 * Для действий без payload второй аргумент опционален.
 */
export type ReducerParameters<
  S extends State,
  A extends Actions,
  T extends ActionType<A>,
> = undefined extends A[T]
  ? [state: S, payload?: ActionPayload<A, T>]
  : [state: S, payload: ActionPayload<A, T>];

/**
 * Редьюсер конкретного действия.
 *
 * Выполняет модификацию состояния.
 */
export type Reducer<S extends State, A extends Actions, T extends ActionType<A>> = (
  ...params: ReducerParameters<S, A, T>
) => void;

/**
 * Исполнитель редьюсера с приведённым типом payload.
 *
 * Хранится в карте редьюсеров и вызывается ViewModel.
 */
export type ReducerExecutor<S extends State, A extends Actions> = (
  state: S,
  payload: ActionPayload<A, ActionType<A>>,
) => void;

/**
 * Карта редьюсеров по имени действия.
 *
 * Используется ViewModel для быстрого поиска обработчика.
 */
export type ReducerMap<S extends State, A extends Actions> = Map<
  ActionType<A>,
  ReducerExecutor<S, A>
>;

/**
 * Строитель карты редьюсеров для ViewModel.
 *
 * Позволяет регистрировать обработчики действий и получать их в виде Map.
 */
export class ReducerBuilder<S extends State, A extends Actions> {
  private readonly reducers = new Map<ActionType<A>, ReducerExecutor<S, A>>();

  /**
   * Добавляет редьюсер для указанного действия.
   *
   * @param type Имя действия, которое должен обрабатывать редьюсер.
   * @param reducer Обработчик, мутирующий состояние для соответствующего действия.
   * @returns Экземпляр построителя для chain-вызовов.
   */
  addCase<T extends ActionType<A>>(type: T, reducer: Reducer<S, A, T>): this {
    this.reducers.set(type, reducer as ReducerExecutor<S, A>);

    return this;
  }

  /**
   * Возвращает карту зарегистрированных редьюсеров.
   *
   * @returns Map с редьюсерами, готовыми к исполнению во ViewModel.
   */
  build(): ReducerMap<S, A> {
    return new Map(this.reducers);
  }
}
