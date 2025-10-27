import GreetingService from '@/app/services/GreetingService';

export default class DetailsViewModel {
  constructor(
    private readonly greetingService: GreetingService,
    private readonly name?: string,
  ) {}

  get message() {
    return this.greetingService.greet(this.name);
  }
}
