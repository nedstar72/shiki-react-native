import { Observable, Subscription } from 'rxjs';

import type { Action, Actions, ActionType } from '../Core';

export type EffectCleanup = Subscription;

export type ActionEffectFactory<A extends Actions, T extends ActionType<A>> = (
  action$: Observable<Action<A, T>>,
) => EffectCleanup;

export type ExternalEffectFactory = () => EffectCleanup;

interface ActionEffectDescriptor<A extends Actions> {
  kind: 'action';
  type: ActionType<A>;
  factory: ActionEffectFactory<A, ActionType<A>>;
}

interface ExternalEffectDescriptor {
  kind: 'external';
  factory: ExternalEffectFactory;
}

type EffectDescriptor<A extends Actions> = ActionEffectDescriptor<A> | ExternalEffectDescriptor;

/**
 * Строитель эффектов для ViewModel.
 *
 * Позволяет регистрировать побочные эффекты на экшены. Привязывает их к жизненному
 * циклу ViewModel.
 */
export class EffectsBuilder<A extends Actions> {
  private readonly effects: EffectDescriptor<A>[] = [];

  /**
   * Добавляет эффект.
   *
   * Может регистрировать обработчик для конкретного экшена либо подписку на внешние observable.
   *
   * @param type Имя экшена, на который должен реагировать эффект.
   * @param handler Функция эффекта, получающая поток экшенов и возвращающая disposer.
   * @returns Экземпляр построителя для chain-вызовов.
   */
  addEffect<T extends ActionType<A>>(type: T, handler: ActionEffectFactory<A, T>): this;
  addEffect(handler: ExternalEffectFactory): this;
  addEffect<T extends ActionType<A>>(
    typeOrHandler: T | ExternalEffectFactory,
    handler?: ActionEffectFactory<A, T>,
  ): this {
    if (typeof typeOrHandler === 'function' && handler === undefined) {
      this.effects.push({ kind: 'external', factory: typeOrHandler });

      return this;
    }

    if (!handler) {
      throw new Error('Для эффекта необходимо передать обработчик.');
    }

    this.effects.push({
      kind: 'action',
      type: typeOrHandler as T,
      factory: handler as unknown as ActionEffectFactory<A, ActionType<A>>,
    });

    return this;
  }

  /**
   * Возвращает зарегистрированные эффекты.
   *
   * @returns Массив описаний эффектов с типом экшена и обработчиком.
   */
  build(): EffectDescriptor<A>[] {
    return [...this.effects];
  }
}
