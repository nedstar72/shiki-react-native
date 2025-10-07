import { action, observable } from 'mobx';

export class Timer {
  @observable accessor secondsPassed: number | undefined;

  @action.bound
  increaseTimer() {
    if (this.secondsPassed === undefined) {
      this.secondsPassed = -1;
    }
    this.secondsPassed += 1;
  }
}
