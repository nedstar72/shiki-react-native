import { GreetingService } from '@/app/services/GreetingService';

import { Container, resolve } from '@/shared/di-engine';

export class WelcomeContainer extends Container {
  constructor(parent?: Container | null) {
    super(parent ?? undefined);
  }

  @resolve(GreetingService, { cached: true })
  accessor greetingService!: GreetingService;
}
