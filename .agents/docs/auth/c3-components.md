# Ключевые компоненты

## AuthService (`src/features/auth/services/AuthService`)

- Оборачивает `react-native-app-auth.authorize` с конфигом Shikimori (client id/secret, redirect URL, scopes `user_rates`, `comments`, `topics`).
- При успехе сохраняет `accessToken` и `refreshToken` через `SecureStore`.
- Геттер `isAuthorized` проверяет наличие токена синхронно, поэтому сейчас всегда возвращает truthy из-за промиса; требует фикса и инициализации состояния после чтения SecureStore.
- Не реализует обновление/отзыв токенов и не отдаёт их наружу для сетевых клиентов.

## SecureStore (`src/features/core/SecureStore`)

- Обёртка над `expo-secure-store` для чтения/записи `accessToken` и `refreshToken`.
- Возвращает значения асинхронно; очистка выполняется через `deleteItemAsync` при передаче пустого значения.
- Пока используется только внутри `AuthService` и не задействована для проверок статуса или прокладки токена в API.

## AuthViewModel (`src/features/auth/viewModels/AuthViewModel`)

- Состояние: `authStatus` (`authorized` | `unauthorized` | `loading` | `error`), инициализируется по `AuthService.isAuthorized` (текущая проблема с синхронной проверкой).
- Actions: `login` → effect запускает `AuthService.authorize` и диспатчит `loginSuccess`/`loginFailure`; `logout` только ставит `unauthorized`, не очищая хранилище.
- Обработка ошибок ограничена переводом статуса в `error`; нет retry, нет фонового восстановления токена и refresh-флоу.

## UI и DI-обвязка

- `AuthButton` диспатчит действие `login` по нажатию; текст кнопки остаётся заглушкой.
- `AuthScreen` показывает статус (`Authorized`/`Unauthorized`) и кнопку, обёрнут через `withContainer(AuthContainer)`; контейнер отдаёт shared `AuthViewModel` из `AuthService`.
- `AuthModule` регистрирует `AuthService` (зависит от `SecureStore`), подключается в `RootContainer`; экран добавлен в стек навигации (`Auth`), ссылка на кнопку в главном экране пока закомментирована.
