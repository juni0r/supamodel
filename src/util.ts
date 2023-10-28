import { object, type ZodSchema } from 'zod'
import { pluralize, underscore } from 'inflection'
import mapValues from 'lodash.mapvalues'
import type { AnyObject, Attribute, Attributes, ZodShapeFrom } from './types'

const New = <T extends AnyObject = AnyObject>() => Object.create(null) as T

const {
  keys,
  assign,
  entries: entriesOf,
  defineProperty,
  setPrototypeOf,
  prototype: { hasOwnProperty },
} = Object

function hasOwnKey(object: object, key: symbol | string | number) {
  return hasOwnProperty.call(object, key)
}

function keysOf<T extends object>(object: T) {
  return keys(object) as (keyof T)[]
}

function snakeCase(key: string | number | symbol) {
  return underscore(key as string)
}

export {
  New,
  assign,
  defineProperty,
  setPrototypeOf,
  hasOwnProperty,
  hasOwnKey,
  keysOf,
  entriesOf,
  snakeCase,
  underscore,
  pluralize,
}

export function zodObjectFrom<A extends Attributes>(attributes: A) {
  return object(mapValues(attributes, 'type') as ZodShapeFrom<A>)
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
