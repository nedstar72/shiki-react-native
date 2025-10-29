/**
 * Универсальный идентификатор зависимости, поддерживающий строки, символы и классы.
 */
export type Token<T> = string | symbol | Constructor<T> | AbstractConstructor<T>;
