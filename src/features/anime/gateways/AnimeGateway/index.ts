import { ApolloClient } from '@apollo/client';
import { array, parse } from 'valibot';

import { FetchAnimeList } from './FetchAnimeList';
import { Anime, AnimeSchema } from '../../entities';

export class AnimeGateway {
  constructor(private readonly apolloClient: ApolloClient) {}

  async getAnimes(): Promise<Anime[]> {
    return this.apolloClient
      .query({
        query: FetchAnimeList,
      })
      .then(result => {
        const schema = array(AnimeSchema);
        return parse(schema, result.data?.animes ?? []);
      });
  }
}
