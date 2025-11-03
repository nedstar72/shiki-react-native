import { StatusBar, useColorScheme } from 'react-native';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { ContainerRegistryProvider } from '@/shared/di-react-native';
import { useCreation } from '@/shared/utils/react';

import RootContainer from './RootContainer';
import { AnimeList } from './screens/AnimeList';
import { AuthScreen } from './screens/Auth';
import { MainScreen } from './screens/Main';

const RootStack = createNativeStackNavigator({
  screens: {
    Welcome: {
      screen: MainScreen,
      options: {
        title: 'Главная',
      },
    },
    Auth: {
      screen: AuthScreen,
      options: {
        title: 'Авторизация',
      },
    },
    AnimeList: {
      screen: AnimeList,
      options: {
        title: 'Список аниме',
      },
    },
  },
});

const Navigation = createStaticNavigation(RootStack);

export function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const rootContainer = useCreation(() => new RootContainer());

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ContainerRegistryProvider rootContainer={rootContainer}>
        <Navigation />
      </ContainerRegistryProvider>
    </>
  );
}
