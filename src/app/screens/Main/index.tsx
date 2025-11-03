import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import Constants from 'expo-constants';

import { useTrailNavigation } from '@/shared/react-navigation-trail';

import TestSVG from './test.svg';
import { Timer } from './Timer';

const UniSafeAreaView = withUnistyles(SafeAreaView);

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    padding: theme.gap(1),
    gap: theme.gap(2),
    backgroundColor: theme.colors.background,
  },
  greetingSection: {
    gap: theme.gap(8),
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  buttonWrapper: {
    alignSelf: 'flex-start',
  },
  legacySection: {
    gap: theme.gap(1),
  },
  legacyText: {
    fontSize: 16,
  },
  timer: {
    fontSize: 18,
    fontWeight: '500',
  },
  svgWrapper: {
    alignItems: 'center',
  },
}));

const timer = new Timer();

const TimerComponent = observer(() => {
  useEffect(() => {
    timer.increaseTimer();
    const interval = setInterval(() => {
      timer.increaseTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <Text style={styles.timer}>Секунд прошло: {timer.secondsPassed ?? 0}</Text>;
});

function LegacyExample() {
  return (
    <View style={styles.legacySection}>
      <Text style={styles.legacyText}>Hello World! 🚀</Text>
      <Text style={styles.legacyText}>{Constants.deviceName ?? 'Unknown'}</Text>
      <TimerComponent />
      <View style={styles.svgWrapper}>
        <TestSVG width={100} height={100} />
      </View>
      {/* <AuthButton /> */}
    </View>
  );
}

export function MainScreen() {
  const navigation = useTrailNavigation();

  return (
    <UniSafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.greetingSection}>
        <Button title={'Авторизация'} onPress={() => navigation.navigate('Auth')} />
      </View>
      <View style={styles.greetingSection}>
        <Button title={'Список аниме'} onPress={() => navigation.navigate('AnimeList')} />
      </View>
      <LegacyExample />
    </UniSafeAreaView>
  );
}
