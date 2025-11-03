import { ApolloClient } from '@apollo/client';

import { Module, provide, resolve } from '@/shared/di-engine';

import { AnimeGateway } from './gateways';

export class AnimeModule extends Module {
  @resolve(ApolloClient)
  accessor apolloClient!: ApolloClient;

  @provide(AnimeGateway)
  get animeGateway() {
    return new AnimeGateway(this.apolloClient);
  }
}
