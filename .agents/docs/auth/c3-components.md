# Ключевые компоненты

## AuthService (`src/features/auth/services/AuthService`)

- Оборачивает `react-native-app-auth.authorize` с конфигом Shikimori (client id/secret, redirect URL, scopes `user_rates`, `comments`, `topics`).
- При успехе сохраняет `accessToken` и `refreshToken` через `SecureStore`; при `logout` очищает оба токена.
- Поток `isAuthorized$` завязан на реактивное чтение токена.
- Не реализует refresh и прокладку токенов в сетевые клиенты.

## SecureStore (`src/features/core/SecureStore`)

- Обёртка над `expo-secure-store` с реактивным чтением: `accessToken$` / `refreshToken$` (BehaviorSubject, первая эмиссия после загрузки).
- Инициализируется чтением токенов при создании; обновляет стримы после set/delete.
- Запись только через методы `setAccessToken` / `setRefreshToken`.

## AuthViewModel (`src/features/auth/viewModels/AuthViewModel`)

- Состояние: `authStatus` (`authorized` | `unauthorized` | `loading` | `error`), стартует в `loading`.
- Actions: `login` → effect вызывает `AuthService.authorize`, ошибки переводят статус в `error`; `logout` чистит токены через сервис.
- Внешний эффект на `isAuthorized$` диспатчит `setAuthStatus`, чтобы выставлять `authorized/unauthorized`.
- Нет retry и refresh-флоу.

## UI и DI-обвязка

- `AuthButton` диспатчит действие `login` по нажатию; текст кнопки остаётся заглушкой.
- `AuthScreen` показывает статус (`Authorized`/`Unauthorized`) и кнопку, обёрнут через `withContainer(AuthContainer)`; контейнер отдаёт shared `AuthViewModel` из `AuthService`.
- `AuthModule` регистрирует `AuthService` (зависит от `SecureStore`), подключается в `RootContainer`; экран добавлен в стек навигации (`Auth`), ссылка на кнопку в главном экране пока закомментирована.
