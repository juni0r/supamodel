/* eslint-disable @typescript-eslint/no-explicit-any */
const {
  keys,
  getOwnPropertyDescriptor,
  prototype: { hasOwnProperty },
} = Object

export interface FnMap<
  K extends string | number | symbol = string,
  T = any,
  B = Record<K, T>,
> {
  (key: keyof B): T
  [key: string | number | symbol]: T
}

export default function fnMap<
  K extends string | number | symbol = string,
  T = any,
  B = Record<K, T>,
>() {
  const bag = Object.create(null) as B
  const get = (key: keyof B) => bag[key]

  return new Proxy(get, {
    get(_t: B, key: keyof B) {
      return bag[key]
    },
    set(_t: B, key: keyof B, v: any) {
      bag[key] = v
      return true
    },
    has(_t: B, key: string) {
      return hasOwnProperty.call(bag, key)
    },
    ownKeys() {
      return keys(bag as object)
    },
    getOwnPropertyDescriptor(_t: B, key: string) {
      return getOwnPropertyDescriptor(bag, key)
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
