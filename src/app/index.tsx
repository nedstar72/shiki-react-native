import { StatusBar, useColorScheme } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ContainerRegistryProvider } from '@/shared/di-navigation';
import { useLazyCreation } from '@/shared/utils/react';

import { RootContainer } from './RootContainer';
import { DetailsScreen } from './screens/Details/DetailsScreen';
import { WelcomeScreen } from './screens/Welcome/WelcomeScreen';

const RootStack = createNativeStackNavigator({
  screens: {
    Welcome: {
      screen: WelcomeScreen,
      options: {
        title: 'Главная',
      },
    },
    Details: {
      screen: DetailsScreen,
      options: {
        title: 'Детали',
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

export function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const rootContainer = useLazyCreation(() => new RootContainer());

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ContainerRegistryProvider rootContainer={rootContainer}>
        <Navigation />
      </ContainerRegistryProvider>
    </>
  );
}
