import { AnimeList } from '@/features/anime';

import { withContainer } from '@/shared/di-react-native';

import { AnimeListContainer } from './AnimeListContainer';

const AnimeListScreen = () => {
  return <AnimeList />;
};

export default withContainer(AnimeListContainer)(AnimeListScreen);
