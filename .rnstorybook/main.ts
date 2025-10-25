import type { StorybookConfig } from '@storybook/react-native';

// FIXME: Возникает следующий warning без причины:
// https://github.com/storybookjs/storybook/blob/dbf7c18ce4a329127028784c61b6f0526f295458/code/core/src/test/testing-library.ts#L26
const main: StorybookConfig = {
  stories: ['../src/**/*.stories.?(ts|tsx)'],
  addons: ['@storybook/addon-ondevice-controls', '@storybook/addon-ondevice-actions'],
};

export default main;
