import { useEffect } from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StatusBar, Text, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

import { AuthButton } from '@/features/auth';

import TestSVG from './test.svg';

const UniSafeAreaView = withUnistyles(SafeAreaView);

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    padding: theme.gap(1),
    backgroundColor: theme.colors.background,
  },
}));

class Timer {
  @observable accessor secondsPassed: number | undefined;

  @action.bound
  increaseTimer() {
    if (this.secondsPassed === undefined) {
      this.secondsPassed = -1;
    }
    this.secondsPassed += 1;
  }
}

const timer = new Timer();

const TimerComponent = observer(() => {
  useEffect(() => {
    timer.increaseTimer();
    const interval = setInterval(() => {
      timer.increaseTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <Text>{timer.secondsPassed}</Text>;
});

export function RootScreen() {
  return (
    <UniSafeAreaView style={styles.container} edges={['bottom']}>
      <Text>Hello World! 🚀</Text>
      <Text>{Constants.deviceName ?? 'Unknown'}</Text>
      <TimerComponent />
      <TestSVG width={100} height={100} />
      <AuthButton />
    </UniSafeAreaView>
  );
}

const RootStack = createNativeStackNavigator({
  screens: {
    Root: RootScreen,
  },
});

const Navigation = createStaticNavigation(RootStack);

export function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Navigation />
    </>
  );
}
