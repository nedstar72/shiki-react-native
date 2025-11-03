import { SecureStore } from '@/features/core';

import { Module, provide, resolve } from '@/shared/di-engine';

import { AuthService } from './services';

export class AuthModule extends Module {
  @resolve(SecureStore)
  accessor secureStore!: SecureStore;

  @provide(AuthService)
  get authService() {
    return new AuthService(this.secureStore);
  }
}
