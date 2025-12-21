import { BehaviorSubject, filter, type Observable, type OperatorFunction } from 'rxjs';
import * as ExpoSecureStore from 'expo-secure-store';

const SecureStoreKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

/**
 * Обёртка над ExpoSecureStore с реактивным чтением токенов.
 */
export class SecureStore {
  private readonly accessTokenSubject = new BehaviorSubject<TokenValue>(INITIAL_TOKEN);
  private readonly refreshTokenSubject = new BehaviorSubject<TokenValue>(INITIAL_TOKEN);

  constructor() {
    this.restoreTokens();
  }

  get accessToken$(): Observable<string | null> {
    return this.accessTokenSubject.asObservable().pipe(skipInitialToken());
  }

  get refreshToken$(): Observable<string | null> {
    return this.refreshTokenSubject.asObservable().pipe(skipInitialToken());
  }

  /**
   * Сохраняет или удаляет access-token и обновляет поток.
   *
   * @param value Значение токена или `null/undefined` для удаления.
   * @returns Промис при завершении операции.
   */
  async setAccessToken(value: string | null | undefined): Promise<void> {
    const normalizedValue = value ?? null;

    if (normalizedValue) {
      await ExpoSecureStore.setItemAsync(SecureStoreKeys.ACCESS_TOKEN, normalizedValue);
      this.accessTokenSubject.next(normalizedValue);
    } else {
      await ExpoSecureStore.deleteItemAsync(SecureStoreKeys.ACCESS_TOKEN);
      this.accessTokenSubject.next(null);
    }
  }

  /**
   * Сохраняет или удаляет refresh-token и обновляет поток.
   *
   * @param value Значение токена или `null/undefined` для удаления.
   * @returns Промис при завершении операции.
   */
  async setRefreshToken(value: string | null | undefined): Promise<void> {
    const normalizedValue = value ?? null;

    if (normalizedValue) {
      await ExpoSecureStore.setItemAsync(SecureStoreKeys.REFRESH_TOKEN, normalizedValue);
      this.refreshTokenSubject.next(normalizedValue);
    } else {
      await ExpoSecureStore.deleteItemAsync(SecureStoreKeys.REFRESH_TOKEN);
      this.refreshTokenSubject.next(null);
    }
  }

  private async restoreTokens(): Promise<void> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        ExpoSecureStore.getItemAsync(SecureStoreKeys.ACCESS_TOKEN),
        ExpoSecureStore.getItemAsync(SecureStoreKeys.REFRESH_TOKEN),
      ]);

      this.accessTokenSubject.next(accessToken);
      this.refreshTokenSubject.next(refreshToken);
    } catch {
      this.accessTokenSubject.next(null);
      this.refreshTokenSubject.next(null);
    }
  }
}

const INITIAL_TOKEN = Symbol('INITIAL_TOKEN');

type TokenValue = string | null | typeof INITIAL_TOKEN;

function skipInitialToken(): OperatorFunction<TokenValue, string | null> {
  return filter((token): token is string | null => token !== INITIAL_TOKEN);
}
