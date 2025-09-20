module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          decorators: {
            version: '2023-05',
          },
        },
      ],
    ],
    plugins: [
      [
        'react-native-unistyles/plugin',
        {
          root: 'src',
        },
      ],
    ],
  };
};
