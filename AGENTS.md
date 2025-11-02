# Руководство для агентов

Работайте с пользователем на русском языке.

## Проверки перед сдачей

- `yarn lint` — проверяет код линтером ESLint и выявляет ошибки качества.
- `yarn type-check` — запускает TypeScript в режиме `--noEmit`, чтобы убедиться в корректности типов.
- `yarn test` — выполняет тесты Jest и подтверждает, что изменения не ломают функциональность.

## Комментарии

- Пишите комментарии на русском языке. Для функций, методов, классов и типов используйте JSDoc-блок `/** ... */`, чтобы зафиксировать назначение, входы, выходы и возможные исключения.
- Короткие пояснения к внутренним полям оформляйте однострочными `//`-комментариями непосредственно перед объявлением; всё остальное документируйте через многострочные блоки.
- Первый абзац JSDoc должен давать краткое описание. Развёрнутые детали переносите в следующие абзацы после пустой строки, соблюдая деловой тон и фокус на сценариях применения.
- Параметры перечисляйте через теги `@param` (имя, при необходимости тип и назначение). Возвращаемое значение описывайте тегом `@returns`, возможные ошибки — `@throws`.
- Экспорты и реэкспорты документировать не нужно.
- Пример оформления:

```ts
/**
 * Сервис формирования приветственных сообщений для стартового экрана.
 *
 * Используется домашним экраном и push-уведомлениями, чтобы персонализировать обращение.
 */
export default class GreetingService {
  /**
   * Формирует персонализированное приветствие.
   *
   * @param name Имя пользователя, отображаемое в приветствии.
   * @returns Строку с персональным или дефолтным приветствием.
   */
  greet(name?: string) {
    return name ? `Привет, ${name}!` : 'Привет, гость!';
  }
}
```

```ts
import { Container, provide } from '@/shared/di-engine';

import GreetingService from '@/app/services/GreetingService';

/**
 * Корневой DI-контейнер приложения.
 */
export default class RootContainer extends Container {
  @provide(GreetingService, { shared: true })
  get greetingService(): GreetingService {
    return new GreetingService();
  }
}
```

## Именование функций

- Используйте `camelCase`, начинайте названия с глагола и отражайте действие, которое выполняет функция.
- Базовые функции: глаголы `create`, `get`, `set`, `add`, `remove`, `update` и т.п. Хорошо: `createTrailNavigation`, `getSafely`, `registerRootServices`. Плохо: `navigation`, `safe`, `services`.
- Обработчики: глаголы `handle`, `process`, `validate`, `transform` и другие, которые подчёркивают роль обработчика. Хорошо: `handleDisposeError`, `processNavigationAction`. Плохо: `error`, `action`.
- Предикаты: начинайте с `is`, `has`, `can`, `should`. Хорошо: `hasSource`, `isDisposed`. Плохо: `source`, `disposed`.
- Примеры корректных объявлений:

```ts
export function createTrailNavigation<Navigation extends AnyNavigation>(
  navigation: Navigation,
  sourceKey: string,
): Navigation { ... }
export function extractSource(route: AnyRoute): string | undefined { ... }
export function registerRootServices(container: Container): Container { ... }
export function createGreeting(name?: string): string { ... }

const dispatchNavigationAction = (action: NavigationAction): NavigationAction => { ... }
const getGreeting = (service: GreetingService): string => { ... }
const subscribeToDisposables = (
  bag: DisposableBag,
  disposable: Disposable,
): DisposableBag => { ... }
```

- Примеры, которых следует избегать:

```ts
export function navigation<Navigation extends AnyNavigation>(
  navigation: Navigation,
  sourceKey: string,
): Navigation { ... }
export function source(route: AnyRoute): string | undefined { ... }
export function services(container: Container): Container { ... }
export function greeting(name?: string): string { ... }

const action = (action: NavigationAction): NavigationAction => { ... }
const str = (service: GreetingService): string => { ... }
const disposable = (bag: DisposableBag, item: Disposable): DisposableBag => { ... }
```

- Специальные случаи: для конструкторов используйте `create`, для геттеров — `get`, сеттеров — `set`, обработчиков событий — `handle`.
- Исключения: типы и интерфейсы называют в `PascalCase`; generic-параметры допускают краткие обозначения; имена коллбэков могут быть существительными (`handler`, `successCallback`), если этого требует контекст.

## Именование переменных

- Используйте `camelCase`, делайте названия описательными, избегайте сокращений. Для коллекций выбирайте множественное число.
- Обычные переменные: опирайтесь на существительные или сочетания с прилагательными. Хорошо: `previousRouteKey`, `nextRouteKey`, `hasSourceParam`. Плохо: `prev`, `next`, `flag`.
- Счётчики и индексы: давайте понятные имена (`navigationLayerCounter`, `disposableIndex`), не ограничивайтесь `i`, `counter`, `id`.
- Булевы значения: начинайте с `is`, `has`, `can`, `should`. Хорошо: `hasSourceParam`, `isDisposed`. Плохо: `source`, `disposed`.
- Объекты и коллекции: придерживайтесь множественного числа для массивов и наборов (`disposables`, `trailRoutes`, `registeredModules`). Избегайте `disposable`, `route`, `module`, если речь идёт о коллекции.
- Константы: `UPPER_SNAKE_CASE` оставляйте для настоящих глобальных констант и ключей (например, `SOURCE_PARAM_KEY`). Для остальных переменных используйте `camelCase`; допускается `PascalCase`, если объект играет роль пространства имён (`AppTokens`, `lightTheme`, `darkTheme`).
- Примеры корректного стиля:

```ts
const disposables: Map<DisposableLike, Disposable> = new Map();
let navigationLayerCounter = 0;
const hasSourceParam = false;
const augmentedParams = augmentParams(payload.params, sourceKey);
const previousRouteKey = route.key;
const nextRouteKey = nextRoute.key;
```

- Примеры, которых стоит избегать:

```ts
const d: Map<DisposableLike, Disposable> = new Map(); // слишком коротко
let counter = 0; // не описывает, что за счётчик
const flag = false; // не ясно, что это за флаг
const params = {}; // непонятно, какие данные хранятся
const prev = route.key; // не ясно, что это за ключ
```

- Исключения: типы, интерфейсы и классы пишутся в `PascalCase`; generic-параметры могут быть короткими (`T`, `Navigation`, `Params`, `Value`); временные переменные в циклах допускают компактные имена вроде `key` или `reducer`.

## Порядок экспортов модулей

- Принципы иерархии: примитивные модули идут перед составными; базовые типы и утилиты — перед функциональными модулями; независимые части — перед зависимыми.
- Поддерживайте чтение «от простого к сложному»: сначала фундаментальные строительные блоки, затем высокоуровневые абстракции.
- Перед упорядочиванием изучайте импорты внутри каждого модуля. Всё, что не зависит от других частей, экспортируйте раньше.
- Проверяйте себя вопросами: способен ли модуль работать без предыдущих экспортов? логичен ли порядок с точки зрения архитектуры? нет ли нелогичных скачков?
- Признаки неверного порядка: нарушения принципа «от простого к сложному», очевидные логические несостыковки.
- Пример:

```ts
// src/shared/di-engine/index.ts
export type { Token } from './Token'; // Базовые идентификаторы зависимостей
export { Container } from './Container'; // Основной DI-контейнер приложения
export { Module, type LoadableModule } from './Module'; // Модули на базе контейнера
export { provide, resolve } from './decorators'; // Декораторы поверх контейнера и модулей
```

1. `Token` не зависит от других частей и формирует фундамент библиотеки.
2. `Container` использует токены и предоставляет доступ к Inversify.
3. `Module` расширяет контейнер, группируя регистрации в модуле.
4. `decorators` опираются на контейнер и модули, поэтому экспортируются последними.

## Именование тестов

- Файлы тестов должны иметь расширение `.spec.ts[x]` и находиться в той же директории, что и тестируемый модуль. Имя файла повторяет имя модуля с суффиксом `.spec.ts`, например `extractSource.ts` → `extractSource.spec.ts`.
- Если тестируется модуль `someModule/index.ts`, то в названии файла используется название модуля - `someModule/someModule.spec.ts`
- Названия тестовых случаев формулируйте на русском языке, начиная с «должен», описывая ожидаемое поведение в настоящем времени.
- Примеры формулировок: «должен возвращать идентификатор источника из параметров маршрута», «должен добавлять source в навигационное действие», «должен освобождать ресурсы при dispose».

## Структура тестов

- Используйте `jest` как основную библиотеку.
- Группируйте связанные проверки в `describe()`, называя блок по тестируемому модулю. Внутри блока применяйте `beforeEach` и `afterEach`, если нужна подготовка или очистка.
- Внутри `it()` придерживайтесь цепочки Arrange → Act → Assert.
- Пример структуры:

```ts
describe('moduleName', () => {
  beforeEach(() => {
    // код настройки
  });

  afterEach(() => {
    // код очистки
  });

  it('должен [описать ожидаемое поведение]', () => {
    // Arrange (Подготовка)
    const input = 'test';

    // Act (Действие)
    const result = functionUnderTest(input);

    // Assert (Проверка)
    expect(result).toBe('expected');
  });
});
```
