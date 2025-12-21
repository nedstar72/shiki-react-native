import { EMPTY, catchError, from, ignoreElements, map, of, switchMap } from 'rxjs';

import { EffectsBuilder, ReducerBuilder, ViewModel } from '@/shared/reactive-state';

import { AuthService } from '../../services';

export interface AuthState {
  authStatus: 'authorized' | 'unauthorized' | 'loading' | 'error';
}

export type AuthAction = {
  login: undefined;
  loginFailure: undefined;
  logout: undefined;
  setAuthStatus: { isAuthorized: boolean };
};

export class AuthViewModel extends ViewModel<AuthState, AuthAction> {
  constructor(private readonly authService: AuthService) {
    super({
      authStatus: 'loading',
    });

    this.initialize();
  }

  override buildReducer(builder: ReducerBuilder<AuthState, AuthAction>): void {
    builder.addCase('login', state => {
      state.authStatus = 'loading';
    });
    builder.addCase('loginFailure', state => {
      state.authStatus = 'error';
    });
    builder.addCase('setAuthStatus', (state, payload) => {
      state.authStatus = payload.isAuthorized ? 'authorized' : 'unauthorized';
    });
  }

  override buildEffects(builder: EffectsBuilder<AuthAction>): void {
    builder.addEffect('login', loginAction$ => {
      return loginAction$
        .pipe(
          switchMap(() =>
            from(this.authService.authorize()).pipe(
              ignoreElements(),
              catchError(() => of(this.createAction('loginFailure'))),
            ),
          ),
        )
        .subscribe(this.dispatch$);
    });

    builder.addEffect('logout', logoutAction$ => {
      return logoutAction$
        .pipe(
          switchMap(() =>
            from(this.authService.logout()).pipe(
              ignoreElements(),
              catchError(() => EMPTY),
            ),
          ),
        )
        .subscribe();
    });

    builder.addEffect(() => {
      return this.authService.isAuthorized$
        .pipe(map(isAuthorized => this.createAction('setAuthStatus', { isAuthorized })))
        .subscribe(this.dispatch$);
    });
  }
}
