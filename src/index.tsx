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

export function RootScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text>Hello World! 🚀</Text>
        <Text>{Constants.deviceName ?? 'Unknown'}</Text>
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
