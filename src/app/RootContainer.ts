import { Container, provide } from '@/shared/di-engine';

import { GreetingService } from './services/GreetingService';

export class RootContainer extends Container {
  @provide(GreetingService, { shared: true })
  get greetingService() {
    return new GreetingService();
  }
}
