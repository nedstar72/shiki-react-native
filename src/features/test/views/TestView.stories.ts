import type { Meta, StoryObj } from '@storybook/react';

import TestView from './TestView';

const meta: Meta<typeof TestView> = {
  title: 'TestView',
  component: TestView,
  parameters: {
    noBackground: true,
  },
};

type Story = StoryObj<typeof TestView>;

export const Default: Story = {};

export default meta;
