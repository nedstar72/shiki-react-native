export default {
  expo: {
    name: 'Shiki',
    slug: 'shiki',
    scheme: 'shiki',
    version: '0.1.0',
    orientation: 'default',
    icon: './assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'dev.nedstar.shiki',
      supportsTablet: true,
    },
    android: {
      package: 'dev.nedstar.shiki',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: './assets/images/splash-icon.png',
          dark: {
            image: './assets/images/splash-icon-dark.png',
            backgroundColor: '#000000',
          },
          imageWidth: 200,
        },
      ],
      [
        'expo-secure-store',
        {
          configureAndroidBackup: true,
          faceIDPermission: 'Allow $(PRODUCT_NAME) to access your Face ID biometric data.',
        },
      ],
    ],
    extra: {
      oauth2: {
        clientId: process.env.EXPO_PUBLIC_OAUTH2_CLIENT_ID,
        clientSecret: process.env.EXPO_PUBLIC_OAUTH2_CLIENT_SECRET,
      },
    },
    experiments: {
      reactCompiler: true,
    },
  },
};
