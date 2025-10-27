import { GreetingService } from '@/app/services/GreetingService';

import { Container, provide, resolve } from '@/shared/di-engine';

import { DetailsViewModel } from './DetailsViewModel';

export interface DetailsScreenParams {
  userName?: string;
}

export class DetailsContainer extends Container {
  private readonly params?: DetailsScreenParams;

  constructor(parent?: Container | null, params?: DetailsScreenParams) {
    super(parent ?? undefined);
    this.params = params;
  }

  @resolve(GreetingService, { cached: true })
  accessor greetingService!: GreetingService;

  @provide(DetailsViewModel)
  get viewModel() {
    return new DetailsViewModel(this.greetingService, this.params?.userName);
  }
}
