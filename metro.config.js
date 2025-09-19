// Learn more https://docs.expo.io/guides/customizing-metro
const { mergeConfig } = require('@react-native/metro-config');
const withStorybook = require('@storybook/react-native/metro/withStorybook');
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  },
  resolver: {
    assetExts: assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],

    // https://dev.to/dannyhw/how-to-swap-between-react-native-storybook-and-your-app-p3o
    resolveRequest: (context, moduleName, platform) => {
      const defaultResolveResult = context.resolveRequest(context, moduleName, platform);

      if (
        process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== 'true' &&
        defaultResolveResult?.filePath?.includes('.rnstorybook/')
      ) {
        return {
          type: 'empty',
        };
      }

      return defaultResolveResult;
    },
  },
};

module.exports = withStorybook(mergeConfig(defaultConfig, config), {
  enabled: process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true',
  useJs: true,
});
