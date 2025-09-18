import { useEffect } from 'react';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { StatusBar, StyleSheet, Text, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { createStaticNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
});

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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text>Hello World! 🚀</Text>
        <Text>{Constants.deviceName ?? 'Unknown'}</Text>
        <TimerComponent />
      </SafeAreaView>
    </SafeAreaProvider>
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
