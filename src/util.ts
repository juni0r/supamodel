/* eslint-disable @typescript-eslint/no-explicit-any */
import { object, type ZodSchema } from 'zod'
import { underscore, camelize, dasherize, pluralize } from 'inflection'

export { default as isEqual } from 'fast-deep-equal'
import mapValues from 'lodash.mapvalues'

import { trackDirty, type DirtyDecorator } from './trackDirty'

import type {
  anyKey,
  AnyObject,
  Attributes,
  AttributeOptions,
  ShapeOf,
  Attribute,
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

function keysOf<T extends object>(object: T) {
  return Object.keys(object) as (keyof T)[]
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
  return { type, ...options } as Attribute<Z>
}

export {
  New,
  Dict,
  trackDirty,
  DirtyDecorator,
  keysOf,
  snakeCase,
  camelCase,
  kebabCase,
  pluralize,
}
