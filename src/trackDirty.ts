import isEmpty from 'lodash.isempty'
import type { AnyObject } from './types'
import { New, isEqual } from './util'
import mapValues from 'lodash.mapvalues'

export type DirtyProxy<T extends AnyObject = AnyObject> = T & DirtyDecorator<T>

export interface DirtyDecorator<T extends AnyObject = AnyObject> {
  $initial: Partial<T>
  $changes: Partial<T>
  $isDirty: boolean
  $didChange(key: keyof T): boolean
  $commit(): DirtyProxy<T>
  $revert(): DirtyProxy<T>
}

export function trackDirty<T extends AnyObject>(object: T) {
  let $initial = New<Partial<T>>()

  function $commit() {
    $initial = New()
    return proxy
  }

  function $revert() {
    Object.entries($initial).forEach(([key, value]) => {
      value !== undefined
        ? (object[key as keyof T] = value)
        : delete object[key]
    })
    return $commit()
  }

  const decorator: DirtyDecorator<T> = {
    get $initial() {
      return $initial
    },
    get $isDirty() {
      return !isEmpty($initial)
    },
    $didChange(prop: keyof T) {
      return prop in $initial
    },
    get $changes() {
      return mapValues($initial, (_, prop) => object[prop])
    },
    $commit,
    $revert,
  }

  const proxy = new Proxy(object, {
    get(target, prop, receiver) {
      if (prop in decorator) {
        return decorator[prop as keyof typeof decorator]
      }
      return Reflect.get(target, prop, receiver)
    },

    set(target, prop, value, receiver) {
      const current = Reflect.get(target, prop, receiver)

      if (prop in $initial) {
        if (isEqual($initial[prop], value)) delete $initial[prop]
      } else {
        if (isEqual(current, value)) return true
        $initial[prop as keyof T] = current
      }

      return value !== undefined
        ? Reflect.set(target, prop, value, receiver)
        : Reflect.deleteProperty(target, prop)
    },

    deleteProperty(target, prop) {
      if (prop in $initial && $initial[prop] === undefined)
        delete $initial[prop]
      return Reflect.deleteProperty(target, prop)
    },
  }) as DirtyProxy<T>

  return proxy
}

export default trackDirty
