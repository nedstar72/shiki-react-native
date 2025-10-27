import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Button, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import Constants from 'expo-constants';

import { GreetingService } from '@/app/services/GreetingService';
import TestSVG from '@/app/test.svg';
import { Timer } from '@/app/Timer';
import { AuthButton } from '@/features/auth';

import { useDependency, useTrailNavigation, withContainer } from '@/shared/di-navigation';

import { WelcomeContainer } from './WelcomeContainer';

const UniSafeAreaView = withUnistyles(SafeAreaView);

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    padding: theme.gap(1),
    gap: theme.gap(2),
    backgroundColor: theme.colors.background,
  },
  greetingSection: {
    gap: theme.gap(1),
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
      <AuthButton />
    </View>
  );
}

function WelcomeScreenContent() {
  const navigation = useTrailNavigation();
  const greetingService = useDependency(GreetingService);

  return (
    <UniSafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.greetingSection}>
        <Text style={styles.title}>{greetingService.greet()}</Text>
        <View style={styles.buttonWrapper}>
          <Button
            title={'К деталям'}
            onPress={() => navigation.navigate('Details', { userName: 'Shiki' })}
          />
        </View>
      </View>
      <LegacyExample />
    </UniSafeAreaView>
  );
}

export const WelcomeScreen = withContainer(WelcomeContainer)(WelcomeScreenContent);
