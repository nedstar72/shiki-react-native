import { EMPTY, from } from 'rxjs';
import { catchError, delay, map, switchMap } from 'rxjs/operators';

import { EffectsBuilder, ReducerBuilder, ViewModel } from '@/shared/reactive-state';

import { Anime } from '../../entities';
import { AnimeGateway } from '../../gateways';

export interface AnimeListState {
  animes: Anime[];
}

export interface AnimeListActions {
  fetchAnimes: undefined;
  setAnimes: Anime[];
}

export class AnimeListViewModel extends ViewModel<AnimeListState, AnimeListActions> {
  constructor(private readonly animeGateway: AnimeGateway) {
    super({
      animes: [],
    });

    this.initialize();
  }

  override buildReducer(builder: ReducerBuilder<AnimeListState, AnimeListActions>) {
    builder.addCase('setAnimes', (state, payload) => {
      state.animes = payload;
    });
  }

  override buildEffects(builder: EffectsBuilder<AnimeListActions>) {
    builder.addEffect('fetchAnimes', fetchAnimes$ => {
      return fetchAnimes$
        .pipe(
          delay(1000),
          switchMap(() =>
            from(this.animeGateway.getAnimes()).pipe(
              map(animes => this.createAction('setAnimes', animes)),
              catchError(() => EMPTY),
            ),
          ),
        )
        .subscribe(this.dispatch$);
    });
  }
}
