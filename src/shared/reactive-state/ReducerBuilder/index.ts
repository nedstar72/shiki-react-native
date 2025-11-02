import { isString } from '@/shared/utils/js';

export type Action = { type: string };

export type State = object;

export type Reducer<S extends State, A extends Action> = (state: S, action: Readonly<A>) => void;

export type ReducerMap<S extends State, A extends Action> = Map<string, Reducer<S, A>>;

export class ReducerBuilder<S extends State, A extends Action> {
  private readonly reducers = new Map<string, Reducer<S, A>>();

  addCase<AType extends A['type']>(
    typeOrAction: AType | Extract<A, { type: AType }>,
    reducer: Reducer<S, Extract<A, { type: AType }>>,
  ): this {
    const type = isString(typeOrAction) ? typeOrAction : typeOrAction.type;

    this.reducers.set(type, reducer as Reducer<S, A>);

    return this;
  }

  build(): ReducerMap<S, A> {
    return new Map(this.reducers);
  }
}
