/* eslint-disable @typescript-eslint/no-explicit-any */
const {
  keys,
  getOwnPropertyDescriptor,
  prototype: { hasOwnProperty },
} = Object

export type anyKey = string | number | symbol

export interface FnMap<K extends anyKey = string, T = any, B = Record<K, T>> {
  (key: keyof B): T
  [key: anyKey]: T
}

export default function fnMap<
  K extends anyKey = string,
  V = any,
  M = Record<K, V>,
>() {
  const map = Object.create(null) as M
  const get = (key: keyof M) => map[key]

  const handler: ProxyHandler<object & M> = {
    get(_, key) {
      return map[key as keyof M]
    },
    set(_, key, val) {
      map[key as keyof M] = val
      return true
    },
    has(_, key: anyKey) {
      return hasOwnProperty.call(map, key)
    },
    ownKeys() {
      return keys(map as object)
    },
    getOwnPropertyDescriptor(_, key: anyKey) {
      return getOwnPropertyDescriptor(map, key)
    },
  }

  return new Proxy(get, handler as ProxyHandler<typeof get>) as FnMap<K, V, M>
}

// const map = fnMap<string, number | string>()

// map.foo = '42'

// Object.assign(map, {
//   bar: 23,
//   baz: 99,
// })

// console.log(map)
// /* { foo: 42, bar: 23, baz: 99 } */

// console.log(map.baz)
// /* 99 */

// console.log(+map('bar') + +map('foo'))
// /* 65 */

// console.log(map('nope'))
// /* undefined */

// console.log('bar' in map)
// /* true */
