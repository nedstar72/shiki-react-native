import ExpoConstants from 'expo-constants';

export const Constants = {
  SHIKIMORI_BASE_URL: 'https://shikimori.one',
  BUNDLE_IDENTIFIER: 'dev.nedstar.shiki',
  OAUTH_CLIENT_ID: ExpoConstants.expoConfig?.extra?.oauth2?.clientId as string,
  OAUTH_CLIENT_SECRET: ExpoConstants.expoConfig?.extra?.oauth2?.clientSecret as string,
} as const;
