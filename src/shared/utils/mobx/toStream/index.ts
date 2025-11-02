import { BehaviorSubject, skip, type Observable } from 'rxjs';
import { autorun, toJS } from 'mobx';
import { deepObserve } from 'mobx-utils';
import { applyPatches, enableMapSet, enablePatches, type Patch } from 'immer';

enablePatches();
enableMapSet();

type TrackMode = 'deep' | 'shallow';

type toStreamOptions = {
  /**
   * Режим отслеживания изменений.
   *
   * - 'shallow' (по умолчанию): отслеживает только изменения полей переданного объекта.
   * - 'deep': глубоко отслеживает все изменения в объекте. Игнорирует механизмы batching из mobx.
   */
  trackMode?: TrackMode;
  /**
   * Булево значение, определяющее, нужно ли испустить событие сразу после создания.
   *
   * `false` - по умолчанию.
   */
  fireImmediately?: boolean;
};

/**
 * Создает RxJS observable из MobX observable.
 */
export default function toStream<T extends object>(
  source: T,
  options?: toStreamOptions,
): { observable: Observable<T>; disposer: () => void } {
  const { trackMode = 'shallow', fireImmediately = false } = options ?? {};

  let snapshot = toJS(source);

  const subject = new BehaviorSubject<T>(snapshot);

  const emit = (nextSnapshot: T) => {
    snapshot = nextSnapshot;
    subject.next(snapshot);
  };

  const stopTracking =
    trackMode === 'shallow' ? shallowTrack(source, emit) : deepTrack(source, snapshot, emit);

  const observable = fireImmediately ? subject.asObservable() : subject.pipe(skip(1));

  const disposer = () => {
    stopTracking();
    subject.complete();
  };

  return { observable, disposer };
}

function shallowTrack<T extends object>(source: T, emit: (next: T) => void): () => void {
  return autorun(() => {
    emit(toJS(source));
  });
}

function deepTrack<T extends object>(
  source: T,
  initialSnapshot: T,
  emit: (next: T) => void,
): () => void {
  let current = initialSnapshot;

  return deepObserve(source, (change: any, path: string) => {
    const patches = changeToPatches(change, path);
    if (patches.length === 0) return;

    current = applyPatches(current, patches);
    emit(current);
  });
}

/**
 * Преобразует единичное изменение, полученное из `deepObserve`, в массив patch-операций Immer.
 * Поддерживаются объекты, массивы и коллекции `Map`, включая события `add`, `update`, `remove`,
 * `delete` и `splice`.
 *
 * @param change Структура изменения, которую передаёт `deepObserve`.
 * @param path Строковый путь до изменяемого участка состояния.
 * @returns Массив операций Immer `Patch[]`, которые отражают изменение.
 */
function changeToPatches(change: any, path: string): Patch[] {
  switch (change.type) {
    case 'add':
      return [
        {
          op: 'add',
          path: toImmerPath(path, change.name),
          value: toJS(change.newValue),
        },
      ];
    case 'update':
      return 'name' in change
        ? [
            {
              op: 'replace',
              path: toImmerPath(path, change.name),
              value: toJS(change.newValue),
            },
          ]
        : [
            {
              op: 'replace',
              path: toImmerPath(path, change.index, { leafIsIndex: true }),
              value: toJS(change.newValue),
            },
          ];
    case 'remove':
    case 'delete':
      return [
        {
          op: 'remove',
          path: toImmerPath(path, change.name),
        },
      ];
    case 'splice': {
      const patches: Patch[] = [];
      const basePath = toImmerPath(path);
      // удаляем removedCount штук, по одному патчу на элемент начиная с index
      for (let i = 0; i < change.removedCount; i++) {
        patches.push({ op: 'remove', path: [...basePath, change.index] });
        // удаляем по тому же индексу, т.к. он «съезжает»
      }
      // вставляем added элементы по порядку
      for (let i = 0; i < change.added.length; i++) {
        patches.push({
          op: 'add',
          path: [...basePath, change.index + i],
          value: toJS(change.added[i]),
        });
      }
      return patches;
    }
    default:
      return [];
  }
}

/**
 * Превращает строковый путь из MobX `deepObserve` (например, `"user.addresses[2].city"`)
 * в массив сегментов, совместимый с Immer (`['user', 'addresses', 2, 'city']`).
 *
 * @param path Строковый путь в формате MobX.
 * @param leaf Опциональное продолжение пути: ключ или индекс.
 * @param options Поведение обработки `leaf`. При `leafIsIndex = true` цифровая строка
 * интерпретируется как число.
 * @returns Массив сегментов пути для Immer.
 */
function toImmerPath(
  path: string,
  leaf?: string | number,
  options?: { leafIsIndex?: boolean },
): (string | number)[] {
  const segments: (string | number)[] = [];
  const segmentPattern = /[^.[\]]+|\[(\d+)\]/g;
  const normalizedPath = path ? path.replace(/\s/g, '').replace(/\//g, '.') : '';
  let match: RegExpExecArray | null;

  while ((match = segmentPattern.exec(normalizedPath))) {
    const [, indexGroup] = match;
    segments.push(indexGroup ? Number(indexGroup) : match[0]);
  }

  if (leaf === undefined) {
    return segments;
  }

  const shouldTreatLeafAsIndex =
    typeof leaf === 'number' ||
    (options?.leafIsIndex && typeof leaf === 'string' && /^\d+$/.test(leaf));

  segments.push(shouldTreatLeafAsIndex ? Number(leaf) : leaf);

  return segments;
}
