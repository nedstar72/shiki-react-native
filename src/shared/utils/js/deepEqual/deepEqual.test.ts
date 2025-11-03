import { deepEqual } from './index';

const array = [1, 2, 3];
const object1 = { a: 1 };
const object2 = { b: 2 };
const object3 = { c: 3 };

const testCases: {
  description: string;
  lhs: unknown;
  rhs: unknown;
  result: boolean;
}[] = [
  {
    description: 'undefined с undefined',
    lhs: undefined,
    rhs: undefined,
    result: true,
  },
  {
    description: 'null с undefined',
    lhs: null,
    rhs: undefined,
    result: false,
  },
  {
    description: 'null с null',
    lhs: null,
    rhs: null,
    result: true,
  },
  {
    description: 'undefined с массивом',
    lhs: undefined,
    rhs: [],
    result: false,
  },
  {
    description: 'null с массивом',
    lhs: null,
    rhs: [],
    result: false,
  },
  {
    description: 'идентичные массивы',
    lhs: array,
    rhs: array,
    result: true,
  },
  {
    description: 'пустые массивы',
    lhs: [],
    rhs: [],
    result: true,
  },
  {
    description: 'массивы с разной длиной',
    lhs: [1, 2, 3],
    rhs: [1, 2],
    result: false,
  },
  {
    description: 'массивы, содержащие ссылочно не равные объекты',
    lhs: [object1, object2, object3],
    rhs: [object1, object2, { c: 3 }],
    result: true,
  },
  {
    description: 'массивы, содержащие ссылочно равные объекты',
    lhs: [object1, object2, object3],
    rhs: [object1, object2, object3],
    result: true,
  },
  {
    description: 'undefined с объектом',
    lhs: undefined,
    rhs: {},
    result: false,
  },
  {
    description: 'null с объектом',
    lhs: null,
    rhs: {},
    result: false,
  },
  {
    description: 'ссылочно равные объекты',
    lhs: object1,
    rhs: object1,
    result: true,
  },
  {
    description: 'пустые объекты',
    lhs: {},
    rhs: {},
    result: true,
  },
  {
    description: 'объекты с разным количеством ключей',
    lhs: { a: 1, b: 2, c: 3 },
    rhs: { a: 1, b: 2 },
    result: false,
  },
  {
    description: 'объекты, содержащие ссылочно не равные объекты',
    lhs: { first: object1, second: object2 },
    rhs: { first: object1, second: { b: 2 } },
    result: true,
  },
  {
    description: 'объекты, содержащие ссылочно равные объекты',
    lhs: { first: object1, second: object2 },
    rhs: { second: object2, first: object1 },
    result: true,
  },
  {
    description: 'объекты с разными ключами',
    lhs: { bob: 'keller' },
    rhs: { keller: 'bob' },
    result: false,
  },
  {
    description: 'объект c массивом',
    lhs: { bob: 'keller' },
    rhs: ['bob', 'keller'],
    result: false,
  },
  {
    description: 'массив с объектом',
    lhs: ['bob', 'keller'],
    rhs: { bob: 'keller' },
    result: false,
  },
  {
    description: 'пустой массив с пустым объектом',
    lhs: [],
    rhs: {},
    result: false,
  },
];

describe('deepEqual', () => {
  testCases.forEach(({ description, lhs, rhs, result }) => {
    it(`Должен возвращать ${result}, когда сравниваем ${description}`, () => {
      expect(deepEqual(lhs, rhs)).toEqual(result);
    });
  });
});
