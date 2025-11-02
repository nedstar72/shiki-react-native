/**
 * @type {import('jest').Config}
 */
const config = {
  preset: 'jest-expo',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['<rootDir>/src/**/*.spec.ts(x)?'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': [
      'babel-jest',
      {
        caller: {
          // https://github.com/expo/expo/issues/25452#issuecomment-2821811684
          platform: 'ios',
        },
      },
    ],
  },
  transformIgnorePatterns: [
    `node_modules/(?!(${[
      '(jest-)?react-native',
      '@react-native(-community)?',
      'expo(nent)?',
      '@expo(nent)?/.*',
      '@expo-google-fonts/.*',
      'react-navigation',
      '@react-navigation/.*',
      '@sentry/react-native',
      'native-base',
      'react-native-svg',
      'immer',
    ].join('|')}))`,
  ],
};

module.exports = config;
