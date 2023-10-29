import type {
  anyKey,
  AnyObject,
  Attribute,
  Attributes,
  ZodShapeFrom,
} from './types'

import mapValues from 'lodash.mapvalues'

import { object, type ZodSchema } from 'zod'
import { underscore, camelize, titleize, pluralize } from 'inflection'

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
  return underscore(key as string)
}

function camelCase(key: anyKey) {
  return camelize(key as string, true)
}

function titleCase(key: anyKey) {
  return titleize(key as string)
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
  camelCase,
  titleCase,
  pluralize,
}

export function zodObjectFrom<A extends Attributes>(attributes: A) {
  return object(mapValues(attributes, 'type') as ZodShapeFrom<A>)
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
