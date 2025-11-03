/**
 * Базовый тип состояния ViewModel.
 */
export type State = object;

/**
 * Базовый тип набора экшенов ViewModel.
 */
export type Actions = object;

/**
 * Имя экшена.
 */
export type ActionType<A extends Actions> = Extract<keyof A, string>;

/**
 * Payload экшена.
 */
export type ActionPayload<A extends Actions, T extends ActionType<A>> = Readonly<A[T]>;

/**
 * Экшен - комбинация имени экшена и его payload.
 */
export type Action<A extends Actions, T extends ActionType<A> = ActionType<A>> = {
  type: T;
} & (undefined extends A[T] ? { payload?: ActionPayload<A, T> } : { payload: ActionPayload<A, T> });

/**
 * Фабрика для создания экшенов.
 */
export function createAction<A extends Actions, T extends ActionType<A>>(
  type: T,
  payload?: ActionPayload<A, T>,
): Action<A, T> {
  return payload ? { type, payload } : ({ type } as Action<A, T>);
}
