import { Subject } from 'rxjs';

import { ViewModel } from './index';
import type { Action } from '../Core';
import type { EffectsBuilder } from '../EffectsBuilder';
import type { ReducerBuilder } from '../ReducerBuilder';

interface CounterActions {
  inc: { by: number } | undefined;
  dec: { by: number } | undefined;
}

type CounterState = { count: number };

class CounterViewModel extends ViewModel<CounterState, CounterActions> {
  constructor() {
    super({ count: 0 });

    this.initialize();
  }

  readonly incEffectActions: Action<CounterActions, 'inc'>[] = [];
  readonly effectDisposer = jest.fn();
  readonly externalEffectEvents: string[] = [];
  readonly externalEffectDisposer = jest.fn();
  externalSource$!: Subject<string>;

  protected override buildReducer(builder: ReducerBuilder<CounterState, CounterActions>): void {
    builder.addCase('inc', (state, payload) => {
      state.count += payload?.by ?? 1;
    });
    builder.addCase('dec', (state, payload) => {
      state.count -= payload?.by ?? 1;
    });
  }

  protected override buildEffects(builder: EffectsBuilder<CounterActions>): void {
    builder.addEffect('inc', action$ => {
      return action$.subscribe({
        next: action => {
          this.incEffectActions.push(action);
        },
        complete: () => {
          this.effectDisposer();
        },
      });
    });
    builder.addEffect(() => {
      if (!this.externalSource$) {
        this.externalSource$ = new Subject<string>();
      }

      const subscription = this.externalSource$.subscribe(value => {
        this.externalEffectEvents.push(value);
      });

      subscription.add(() => {
        this.externalEffectDisposer();
      });

      return subscription;
    });
  }

  // Делаем публичным для тестирования
  registerTestDisposable(disposable: () => void): void {
    this.registerDisposable(disposable);
  }

  // Делаем публичным для тестирования
  observeAction<T extends keyof CounterActions>(type: T) {
    return this.actionOf(type);
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

    const subscription = vm.action$.subscribe(() => {
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
    const actions: (Action<CounterActions> | { type: string })[] = [];

    const stateSubscription = vm.state$.subscribe(value => states.push(value));
    const actionSubscription = vm.action$.subscribe(value => actions.push(value));

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
    const actionSubscription = vm.action$.subscribe({ complete: actionComplete });

    vm.dispose();

    expect(actionComplete).toHaveBeenCalledTimes(1);
    expect(actionSubscription.closed).toBe(true);
  });

  it('должен подписывать эффекты на соответствующие экшены', () => {
    const vm = new CounterViewModel();

    vm.dispatch('inc', { by: 2 });
    vm.dispatch('dec', { by: 3 });
    vm.dispatch('inc');

    expect(vm.incEffectActions).toEqual([{ type: 'inc', payload: { by: 2 } }, { type: 'inc' }]);
  });

  it('должен поддерживать эффекты без привязки к экшенам', () => {
    const vm = new CounterViewModel();

    vm.externalSource$.next('value-1');
    vm.externalSource$.next('value-2');

    expect(vm.externalEffectEvents).toEqual(['value-1', 'value-2']);
  });

  it('должен освобождать ресурсы эффектов при dispose', () => {
    const vm = new CounterViewModel();

    vm.dispatch('inc');
    vm.dispose();

    expect(vm.effectDisposer).toHaveBeenCalledTimes(1);
    expect(vm.externalEffectDisposer).toHaveBeenCalledTimes(1);
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

  describe('actionOf', () => {
    it('должен испускать экшены указанного типа с сохранением payload', () => {
      const vm = new CounterViewModel();
      const incActions: Action<CounterActions, 'inc'>[] = [];

      const subscription = vm.observeAction('inc').subscribe(action => {
        incActions.push(action);
      });

      vm.dispatch('dec', { by: 4 });
      vm.dispatch('inc', { by: 2 });
      vm.dispatch('inc');

      expect(incActions).toEqual([{ type: 'inc', payload: { by: 2 } }, { type: 'inc' }]);

      subscription.unsubscribe();
    });

    it('должен завершаться вместе с ViewModel', () => {
      const vm = new CounterViewModel();
      const completeSpy = jest.fn();

      const subscription = vm.observeAction('dec').subscribe({
        complete: completeSpy,
      });

      vm.dispose();

      expect(completeSpy).toHaveBeenCalledTimes(1);
      expect(subscription.closed).toBe(true);
    });
  });

  it('должен вызывать эффекты после инициализации, когда зависимости уже заданы', () => {
    const dependency = { handle: jest.fn() };

    class DependentViewModel extends ViewModel<{ ready: boolean }, { noop: undefined }> {
      constructor(private readonly dep: typeof dependency) {
        super({ ready: false });

        this.initialize();
      }

      protected override buildEffects(builder: EffectsBuilder<{ noop: undefined }>): void {
        builder.addEffect(() => {
          this.dep.handle();

          return new Subject<void>().subscribe();
        });
      }
    }

    const vm = new DependentViewModel(dependency);

    expect(dependency.handle).toHaveBeenCalledTimes(1);

    vm.dispose();
  });
});
