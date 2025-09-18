import { StyleSheet, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
  },
});

export function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text>Hello World! 🚀</Text>
        <Text>{Constants.deviceName ?? 'Unknown'}</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
