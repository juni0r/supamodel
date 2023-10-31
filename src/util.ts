/* eslint-disable @typescript-eslint/no-explicit-any */
import { object, type ZodSchema } from 'zod'
import { underscore, camelize, dasherize, pluralize } from 'inflection'

import mapValues from 'lodash.mapvalues'
import isEqual from 'fast-deep-equal'

import { trackDirty, type DirtyDecorator } from './trackDirty'

import type {
  anyKey,
  AnyObject,
  Attributes,
  AttributeOptions,
  ShapeOf,
} from './types'

const New = <T extends AnyObject = AnyObject>(...defaults: AnyObject[]) =>
  Object.assign(Object.create(null), ...defaults) as T

type Dict<T = any> = Record<string, T>
const Dict = <T>(...defaults: Dict<T>[]) => New<Dict<T>>(...defaults)

export interface DirtyDict extends DirtyDecorator<Dict> {
  [key: string]: any
}

export function TrackedDirty() {
  return trackDirty(Dict()) as DirtyDict
}

const {
  keys,
  assign,
  entries,
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

export const identity = <T>(v: T) => v

export function attr<Z extends ZodSchema>(
  type: Z,
  options?: AttributeOptions<Z>,
) {
  return { type, column: '', take: identity, emit: identity, ...options }
}

export {
  New,
  Dict,
  isEqual,
  trackDirty,
  DirtyDecorator,
  assign,
  defineProperty,
  setPrototypeOf,
  hasOwnProperty,
  hasOwnKey,
  keysOf,
  entries as entriesOf,
  snakeCase,
  camelCase,
  kebabCase,
  pluralize,
}
