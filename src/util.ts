import { underscore, camelize, dasherize, pluralize } from 'inflection'
import { trackDirty, type DirtyDecorator } from './trackDirty'
import type { AnyObject, KeyMapper } from './types'

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

const snakeCase: KeyMapper = (key: string) => underscore(key)
const camelCase: KeyMapper = (key: string) => camelize(key, true)
const kebabCase: KeyMapper = (key: string) => dasherize(key)

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
