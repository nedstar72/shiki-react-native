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
    env: {
      test: {
        plugins: ['@babel/plugin-transform-class-static-block'],
      },
    },
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
