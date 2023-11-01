/* eslint-disable @typescript-eslint/no-explicit-any */
import { underscore, camelize, dasherize, pluralize } from 'inflection'
import { trackDirty, type DirtyDecorator } from './trackDirty'
import type { anyKey, AnyObject } from './types'

export { default as isEqual } from 'fast-deep-equal'

const New = <T extends AnyObject = AnyObject, U = T>(
  ...defaults: Partial<T>[]
) => Object.assign(Object.create(null), ...defaults) as U

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

export function keyzOf<T extends AnyObject>(
  object: T,
  block: <K extends keyof T>(key: K) => T[K],
) {
  return Object.keys(object).map(block)
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
