import { AnimeGateway, AnimeListViewModel } from '@/features/anime';

import { Container, provide, resolve } from '@/shared/di-engine';

export class AnimeListContainer extends Container {
  @resolve(AnimeGateway)
  accessor animeGateway!: AnimeGateway;

  @provide(AnimeListViewModel)
  get animeListViewModel() {
    return new AnimeListViewModel(this.animeGateway);
  }
}
