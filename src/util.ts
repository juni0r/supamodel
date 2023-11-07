import { underscore, camelize, dasherize, pluralize } from 'inflection'
import { trackDirty, type DirtyDecorator } from './trackDirty'
import { SupamodelError } from './errors'
import type { AnyObject, FilterBuilder, KeyMapper } from './types'

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

export const identity = <T>(val: T) => val

const snakeCase: KeyMapper = (key: string) => underscore(key)
const camelCase: KeyMapper = (key: string) => camelize(key, true)
const kebabCase: KeyMapper = (key: string) => dasherize(key)

export function asData<T>(data: T) {
  return { data, error: null }
}

export function scoped<T>(filter: FilterBuilder<T>, scope: Dict) {
  return Object.entries(scope).reduce(
    (where, [key, value]) => where.eq(key, value),
    filter,
  )
}

export function failWith<U extends { new (...args: any): SupamodelError }>(
  error: U,
  ...args: ConstructorParameters<U>
): { error: U extends { new (...args: any): infer T } ? T : never; data: null }
export function failWith<T>(error: T): { error: T; data: null }
export function failWith(error: any, ...args: any) {
  if (error === SupamodelError || error.prototype instanceof SupamodelError) {
    error = new error(...args)
  }
  return { error, data: null }
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
