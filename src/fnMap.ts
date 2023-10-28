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
  T = any,
  B = Record<K, T>,
>() {
  const map = Object.create(null) as B
  const get = (key: keyof B) => map[key]

  return new Proxy(get, {
    get(_t: B, key: keyof B) {
      return map[key]
    },
    set(_t: B, key: keyof B, v: any) {
      map[key] = v
      return true
    },
    has(_t: B, key: K) {
      return hasOwnProperty.call(map, key)
    },
    ownKeys() {
      return keys(map as object)
    },
    getOwnPropertyDescriptor(_t: B, key: K) {
      return getOwnPropertyDescriptor(map, key)
    },
  } as ProxyHandler<typeof get>) as FnMap<K, T, B>
}

// const map = fnMap<string, number>()

// map.foo = 42

// Object.assign(map, {
//   bar: 23,
//   baz: 99,
// })

// console.log(map)
// /* { foo: 42, bar: 23, baz: 99 } */

// console.log(map.baz)
// /* 99 */

// console.log(map('bar') + map('foo'))
// /* 65 */

// console.log(map('nope'))
// /* undefined */

// console.log('bar' in map)
// /* true */
