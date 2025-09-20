import { AppRegistry } from 'react-native';

// Configure unistyles
import '@/shared/themes';

import { name as appName } from './app.json';
import { App } from './src/app';

let AppEntry;

if (process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true') {
  AppEntry = require('./.rnstorybook').default;
} else {
  AppEntry = App;
}

AppRegistry.registerComponent(appName, () => AppEntry);
