import { catchError, from, map, of, switchMap } from 'rxjs';

import { EffectsBuilder, ReducerBuilder, ViewModel } from '@/shared/reactive-state';

import { AuthService } from '../../services';

export interface AuthState {
  authStatus: 'authorized' | 'unauthorized' | 'loading' | 'error';
}

export type AuthAction = {
  login: undefined;
  loginSuccess: undefined;
  loginFailure: undefined;
  logout: never;
};

export class AuthViewModel extends ViewModel<AuthState, AuthAction> {
  constructor(private readonly authService: AuthService) {
    super({
      authStatus: authService.isAuthorized ? 'authorized' : 'unauthorized',
    });
  }

  override buildReducer(builder: ReducerBuilder<AuthState, AuthAction>): void {
    builder.addCase('login', state => {
      state.authStatus = 'loading';
    });
    builder.addCase('loginSuccess', state => {
      state.authStatus = 'authorized';
    });
    builder.addCase('loginFailure', state => {
      state.authStatus = 'error';
    });
    builder.addCase('logout', state => {
      state.authStatus = 'unauthorized';
    });
  }

  override buildEffects(builder: EffectsBuilder<AuthAction>): void {
    builder.addEffect('login', loginAction$ => {
      return loginAction$
        .pipe(
          switchMap(() =>
            from(this.authService.authorize()).pipe(
              map(() => this.createAction('loginSuccess')),
              catchError(() => of(this.createAction('loginFailure'))),
            ),
          ),
        )
        .subscribe(this.dispatch$);
    });
  }
}
