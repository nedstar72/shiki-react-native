import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

import { AnimeModule } from '@/features/anime';
import { AuthModule } from '@/features/auth';
import { Constants, CoreModule } from '@/features/core';

import { Container, provide } from '@/shared/di-engine';

export default class RootContainer extends Container {
  constructor() {
    super();
    this.load(new CoreModule(), new AuthModule(), new AnimeModule());
  }

  @provide(ApolloClient, { shared: true })
  get apolloClient() {
    return new ApolloClient({
      link: new HttpLink({ uri: `${Constants.SHIKIMORI_BASE_URL}/api/graphql` }),
      cache: new InMemoryCache(),
    });
  }
}
