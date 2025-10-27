import { Button, StyleSheet, Text, View } from 'react-native';

import { useDependency, useTrailNavigation, withContainer } from '@/shared/di-navigation';

import { DetailsContainer } from './DetailsContainer';
import { DetailsViewModel } from './DetailsViewModel';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  hint: {
    fontSize: 16,
  },
});

function DetailsScreenContent() {
  const navigation = useTrailNavigation();
  const viewModel = useDependency(DetailsViewModel);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{viewModel.message}</Text>
      <Text style={styles.hint}>
        Данные пришли из родительского контейнера и переиспользуют GreetingService.
      </Text>
      <Button title='Назад' onPress={() => navigation.goBack()} />
    </View>
  );
}

export const DetailsScreen = withContainer(DetailsContainer)(DetailsScreenContent);
