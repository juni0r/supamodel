import { underscore, camelize, dasherize, pluralize } from 'inflection'
import { trackDirty, type DirtyDecorator } from './trackDirty'
import { SupamodelError } from './errors'
import isEqual from 'fast-deep-equal'
import type { AnyObject, FilterBuilder, KeyMapper } from './types'

const New = <T extends AnyObject = AnyObject, U = T>(
  ...defaults: Partial<T>[]
) => Object.assign(Object.create(null), ...defaults) as U

type Dict<T = any> = Record<string, T>
const Dict = <T>(...defaults: Dict<T>[]) => New<Dict<T>>(...defaults)

type DirtyDict<T extends AnyObject = Dict> = T & DirtyDecorator<T>

function TrackedDirty<T extends AnyObject = Dict>(dict: T = Dict() as any) {
  return trackDirty(dict) as DirtyDict<T>
}

function keysOf<T extends object>(object: T) {
  return Object.keys(object) as (keyof T)[]
}

const identity = <T>(val: T) => val

const snakeCase: KeyMapper = (key: string) => underscore(key)
const camelCase: KeyMapper = (key: string) => camelize(key, true)
const kebabCase: KeyMapper = (key: string) => dasherize(key)

function asData<T>(data: T) {
  return { data, error: null }
}

function failWith<U extends { new (...args: any): SupamodelError }>(
  error: U,
  ...args: ConstructorParameters<U>
): { error: U extends { new (...args: any): infer T } ? T : never; data: null }
function failWith<T>(error: T): { error: T; data: null }
function failWith(error: any, ...args: any) {
  if (error === SupamodelError || error.prototype instanceof SupamodelError) {
    error = new error(...args)
  }
  return { error, data: null }
}

function scoped<T>(filter: FilterBuilder<T>, scope: Dict) {
  return Object.entries(scope).reduce(
    (where, [key, value]) => where.eq(key, value),
    filter,
  )
}

export {
  New,
  Dict,
  asData,
  failWith,
  trackDirty,
  TrackedDirty,
  DirtyDecorator,
  scoped,
  keysOf,
  isEqual,
  identity,
  snakeCase,
  camelCase,
  kebabCase,
  pluralize,
}
export type { DirtyDict }
