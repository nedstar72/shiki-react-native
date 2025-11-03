import { AuthService, AuthViewModel } from '@/features/auth';

import { Container, provide, resolve } from '@/shared/di-engine';

export class AuthContainer extends Container {
  @resolve(AuthService)
  accessor authService!: AuthService;

  @provide(AuthViewModel, { shared: true })
  get authViewModel() {
    return new AuthViewModel(this.authService);
  }
}
