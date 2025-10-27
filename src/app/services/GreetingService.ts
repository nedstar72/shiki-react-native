export class GreetingService {
  greet(name?: string) {
    return name ? `Привет, ${name}!` : 'Привет, гость!';
  }
}
