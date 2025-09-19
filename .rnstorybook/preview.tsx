import { View } from 'react-native';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
  decorators: [
    (Story, { parameters }) => (
      <View
        style={{
          flex: 1,
          backgroundColor: parameters.noBackground === true ? undefined : '#26c6da',
          padding: 8,
        }}
      >
        <Story />
      </View>
    ),
  ],
};

export default preview;
