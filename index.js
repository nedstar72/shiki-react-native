import { AppRegistry } from 'react-native';

import 'reflect-metadata';
import '@/shared/themes'; // Configure unistyles

import Storybook from './.rnstorybook';
import { name as appName } from './app.json';
import { App } from './src/app';

const isStorybookEnabled = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

AppRegistry.registerComponent(appName, () => (isStorybookEnabled ? Storybook : App));
