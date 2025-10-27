import { AppRegistry } from 'react-native';

import 'reflect-metadata';
import '@/shared/themes'; // Configure unistyles

import { name as appName } from './app.json';
import { App } from './src/app';

let AppEntry;

if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true') {
  AppEntry = require('./.rnstorybook').default;
} else {
  AppEntry = App;
}

AppRegistry.registerComponent(appName, () => AppEntry);
