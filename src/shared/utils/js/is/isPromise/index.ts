/**
 * Определяет, является ли значение подобным промису.
 *
 * Проверка основана на наличии функции then, что соответствует спецификации промисов и совместимых объектов.
 *
 * @param value Значение для проверки совместимости с PromiseLike.
 * @returns Булево значение, указывающее на наличие интерфейса PromiseLike.
 */
export default function isPromise(value: unknown): value is PromiseLike<unknown> {
  return !!value && typeof (value as any).then === 'function';
}
