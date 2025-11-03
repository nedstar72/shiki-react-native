import { ViewModel, type ViewModelAction } from './index';
import { ReducerBuilder } from '../ReducerBuilder';

interface CounterActions {
  inc: { by: number } | undefined;
  dec: { by: number } | undefined;
}

type CounterState = { count: number };

class CounterViewModel extends ViewModel<CounterState, CounterActions> {
  constructor() {
    super({ count: 0 });
  }

  protected override buildReducer(builder: ReducerBuilder<CounterState, CounterActions>): void {
    builder.addCase('inc', (state, payload) => {
      state.count += payload?.by ?? 1;
    });
    builder.addCase('dec', (state, payload) => {
      state.count -= payload?.by ?? 1;
    });
  }

  // Делаем публичным для тестирования
  registerTestDisposable(disposable: () => void): void {
    this.registerDisposable(disposable);
  }
}

describe('ViewModel', () => {
  it('должен обрабатывать экшены через редьюсеры и обновлять состояние', () => {
    const vm = new CounterViewModel();

    expect(vm.state.count).toBe(0);

    vm.dispatch('inc', { by: 2 });
    vm.dispatch('dec');

    expect(vm.state.count).toBe(1);
  });

  it('должен выполнять редьюсеры перед внешними подписчиками $action', () => {
    const vm = new CounterViewModel();
    const observedStates: number[] = [];

    const subscription = vm.$action.subscribe(() => {
      observedStates.push(vm.state.count);
    });

    vm.dispatch('inc');

    expect(observedStates).toEqual([1]);

    subscription.unsubscribe();
  });

  it('должен игнорировать неизвестные экшены', () => {
    const vm = new CounterViewModel();

    expect(() => {
      // @ts-expect-error
      vm.dispatch('noop');
    }).not.toThrow();
    expect(vm.state.count).toBe(0);
  });

  it('должен публиковать состояние и экшены как observable', async () => {
    const vm = new CounterViewModel();
    const states: CounterState[] = [];
    const actions: (ViewModelAction<CounterActions> | { type: string })[] = [];

    const stateSubscription = vm.$state.subscribe(value => states.push(value));
    const actionSubscription = vm.$action.subscribe(value => actions.push(value));

    vm.dispatch('inc', { by: 2 });
    // @ts-expect-error
    vm.dispatch('noop');

    expect(states.map(s => s.count)).toEqual([0, 2]);
    expect(actions).toEqual([{ type: 'inc', payload: { by: 2 } }, { type: 'noop' }]);

    stateSubscription.unsubscribe();
    actionSubscription.unsubscribe();
  });

  it('должен привязывать пользовательские ресурсы через registerDisposable к жизненному циклу ViewModel', () => {
    const disposer = jest.fn();
    const vm = new CounterViewModel();

    vm.registerTestDisposable(disposer);

    vm.dispose();

    expect(disposer).toHaveBeenCalledTimes(1);
  });

  it('должен закрывать ресурсы при dispose', () => {
    const vm = new CounterViewModel();

    const actionComplete = jest.fn();
    const actionSubscription = vm.$action.subscribe({ complete: actionComplete });

    vm.dispose();

    expect(actionComplete).toHaveBeenCalledTimes(1);
    expect(actionSubscription.closed).toBe(true);
  });

  describe('select', () => {
    it('должен испускать значения после изменений в отслеживаемой части состояния', () => {
      const vm = new CounterViewModel();
      const values: number[] = [];

      const subscription = vm.select(state => state.count).subscribe(value => values.push(value));

      expect(values).toHaveLength(0);

      // @ts-expect-error
      vm.dispatch('noop');

      expect(values).toHaveLength(0);

      vm.dispatch('inc');

      expect(values).toEqual([1]);

      subscription.unsubscribe();
    });

    it('должен испускать текущее значение сразу при fireImmediately = true', () => {
      const vm = new CounterViewModel();
      const values: number[] = [];

      const subscription = vm
        .select(state => state.count, { fireImmediately: true })
        .subscribe(value => values.push(value));

      expect(values).toEqual([0]);

      vm.dispatch('inc');

      expect(values).toEqual([0, 1]);

      subscription.unsubscribe();
    });
  });
});
