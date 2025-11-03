import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { Text, View } from 'react-native';

import { useViewModel } from '@/shared/reactive-state';

import { AnimeListViewModel } from '../../viewModels';

export const AnimeList = observer(() => {
  const animeListViewModel = useViewModel(AnimeListViewModel);

  useEffect(() => {
    animeListViewModel.dispatch('fetchAnimes');
  }, [animeListViewModel]);

  return (
    <View>
      <Text>Anime List:</Text>
      {animeListViewModel.state.animes.map(anime => (
        <Text key={anime.id}>{anime.name}</Text>
      ))}
    </View>
  );
});
