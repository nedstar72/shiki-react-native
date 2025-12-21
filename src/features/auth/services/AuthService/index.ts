import { map, type Observable } from 'rxjs';
import { authorize } from 'react-native-app-auth';

import { Constants, SecureStore } from '@/features/core';

export class AuthService {
  constructor(private readonly secureStore: SecureStore) {}

  get isAuthorized$(): Observable<boolean> {
    return this.secureStore.accessToken$.pipe(map(token => Boolean(token)));
  }

  async authorize(): Promise<void> {
    const { accessToken, refreshToken } = await authorize({
      clientId: Constants.OAUTH_CLIENT_ID,
      clientSecret: Constants.OAUTH_CLIENT_SECRET,
      redirectUrl: `${Constants.BUNDLE_IDENTIFIER}://oauth`,
      scopes: ['user_rates', 'comments', 'topics'],
      serviceConfiguration: {
        authorizationEndpoint: `${Constants.SHIKIMORI_BASE_URL}/oauth/authorize`,
        tokenEndpoint: `${Constants.SHIKIMORI_BASE_URL}/oauth/token`,
      },
    });

    await this.secureStore.setAccessToken(accessToken);
    await this.secureStore.setRefreshToken(refreshToken);
  }

  async logout(): Promise<void> {
    await Promise.all([
      this.secureStore.setAccessToken(null),
      this.secureStore.setRefreshToken(null),
    ]);
  }
}
