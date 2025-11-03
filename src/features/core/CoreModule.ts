import { Module, provide } from '@/shared/di-engine';

import { SecureStore } from './SecureStore';

export class CoreModule extends Module {
  @provide(SecureStore)
  get secureStore() {
    return new SecureStore();
  }
}
