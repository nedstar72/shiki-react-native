import * as ExpoSecureStore from 'expo-secure-store';

const SecureStoreKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
} as const;

export class SecureStore {
  get accessToken(): Promise<string | null> {
    return ExpoSecureStore.getItemAsync(SecureStoreKeys.ACCESS_TOKEN);
  }

  get refreshToken(): Promise<string | null> {
    return ExpoSecureStore.getItemAsync(SecureStoreKeys.REFRESH_TOKEN);
  }

  setAccessToken(value: string | null | undefined) {
    if (value) {
      return ExpoSecureStore.setItemAsync(SecureStoreKeys.ACCESS_TOKEN, value);
    } else {
      return ExpoSecureStore.deleteItemAsync(SecureStoreKeys.ACCESS_TOKEN);
    }
  }

  setRefreshToken(value: string | null | undefined) {
    if (value) {
      return ExpoSecureStore.setItemAsync(SecureStoreKeys.REFRESH_TOKEN, value);
    } else {
      return ExpoSecureStore.deleteItemAsync(SecureStoreKeys.REFRESH_TOKEN);
    }
  }
}
