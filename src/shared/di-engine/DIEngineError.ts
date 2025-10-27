/**
 * Исключение ядра DI-движка для сигнализации об ошибках конфигурации контейнера.
 *
 * Используется декораторами и инфраструктурными компонентами при нарушении контрактов.
 */
export default class DIEngineError extends Error {}

/**
 * Проверяет, относится ли значение к DIEngineError.
 */
export function isDIEngineError(value: unknown): value is DIEngineError {
  return value instanceof DIEngineError;
}
