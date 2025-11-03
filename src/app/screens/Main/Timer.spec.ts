import { Timer } from './Timer';

describe('Timer', () => {
  it('оставляет значение неопределённым до первого запуска', () => {
    const timer = new Timer();

    expect(timer.secondsPassed).toBeUndefined();
  });

  it('устанавливает значение в ноль при первом увеличении', () => {
    const timer = new Timer();

    timer.increaseTimer();

    expect(timer.secondsPassed).toBe(0);
  });

  it('увеличивает счётчик при повторных вызовах', () => {
    const timer = new Timer();

    timer.increaseTimer();
    timer.increaseTimer();
    timer.increaseTimer();

    expect(timer.secondsPassed).toBe(2);
  });
});
