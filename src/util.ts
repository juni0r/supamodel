import { ZodSchema } from 'zod'
import { pluralize, underscore } from 'inflection'
import type { Attribute } from './types'

const Empty = <T = object>() => Object.create(null) as T

const {
  assign,
  defineProperty,
  setPrototypeOf,
  prototype: { hasOwnProperty },
} = Object

const hasOwnKey = (object: object, key: symbol | string | number) =>
  hasOwnProperty.call(object, key)

const keysOf = <T extends object>(object: T) =>
  Object.keys(object) as (keyof T)[]

const identity = (v: unknown) => v

const snakeCase = (key: string) => underscore(key)

export {
  Empty,
  assign,
  defineProperty,
  setPrototypeOf,
  hasOwnProperty,
  hasOwnKey,
  keysOf,
  identity,
  snakeCase,
  underscore,
  pluralize,
}

export function attr<Z extends ZodSchema>(
  type: Z,
  options?: Partial<Omit<Attribute<Z>, 'type'>>,
) {
  return { type, primary: false, column: '', ...options }
}

export function hasKeyProxy<T extends object>(object: T) {
  return new Proxy(object, {
    get: (target, key) => hasOwnKey(target, key),
  }) as Record<keyof T, boolean>
}
