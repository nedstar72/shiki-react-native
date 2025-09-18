const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const EXTERNAL_IMPORT_ORDER = [
  'react',
  'mobx',
  'mobx-react-lite',
  'react-native',
  'react-native-**',
  '@react-navigation/**',
  'expo',
  'expo-**',
];

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['.expo', 'node_modules'],
  },
  {
    rules: {
      'import/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'internal', 'object', ['parent', 'sibling', 'index']],
          pathGroups: [
            {
              pattern: '@/shared/**',
              group: 'object',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
            ...EXTERNAL_IMPORT_ORDER.map(packageName => ({
              pattern: packageName,
              group: 'external',
              position: 'before',
            })),
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'object'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
            orderImportKind: 'ignore',
          },
          distinctGroup: false,
        },
      ],
    },
  },
]);
