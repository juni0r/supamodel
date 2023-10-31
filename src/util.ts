import { object, type ZodSchema } from 'zod'
import { underscore, camelize, dasherize, pluralize } from 'inflection'

import mapValues from 'lodash.mapvalues'

import type { anyKey, AnyObject, Attribute, Attributes, ShapeOf } from './types'

const New = <T extends AnyObject = AnyObject>() => Object.create(null) as T

const {
  keys,
  assign,
  entries: entriesOf,
  defineProperty,
  setPrototypeOf,
  prototype: { hasOwnProperty },
} = Object

function hasOwnKey(object: object, key: anyKey) {
  return hasOwnProperty.call(object, key)
}

function keysOf<T extends object>(object: T) {
  return keys(object) as (keyof T)[]
}

function snakeCase(key: anyKey) {
  return underscore(String(key))
}

function camelCase(key: anyKey) {
  return camelize(String(key), true)
}

function kebabCase(key: anyKey) {
  return dasherize(String(key))
}

export function zodSchemaOf<A extends Attributes>(attributes: A) {
  return object(mapValues(attributes, 'type') as ShapeOf<A>)
}

export function attr<Z extends ZodSchema>(
  type: Z,
  options?: Partial<Omit<Attribute<Z>, 'type'>>,
) {
  return { type, column: '', ...options }
}

export function hasKeyProxy<T extends object>(object: T) {
  return new Proxy(object, {
    get: (target, key) => hasOwnKey(target, key),
  }) as Record<keyof T, boolean>
}

export { default as isEqual } from 'fast-deep-equal'
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
  camelCase,
  kebabCase,
  pluralize,
}
