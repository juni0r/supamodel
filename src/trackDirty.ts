/* eslint-disable @typescript-eslint/no-explicit-any */
import isEmpty from 'lodash.isempty'
import type { AnyObject } from './types'
import { New, isEqual } from './util'

export interface DirtyDecorator<T extends AnyObject = AnyObject> {
  $initial: Partial<T>
  $isDirty: boolean
  $didChange(key: keyof T): boolean
  $commit(): void
  $revert(): void
}

export function trackDirty<T extends AnyObject>(object: T) {
  let $initial = New<Partial<T>>()

  function $commit() {
    $initial = New()
  }

  function $revert() {
    Object.assign(object, $initial)
    $commit()
  }

  const decorator: DirtyDecorator<T> = {
    get $initial() {
      return $initial
    },
    $didChange(prop: keyof T) {
      return prop in $initial
    },
    get $isDirty() {
      return !isEmpty($initial)
    },
    $commit,
    $revert,
  }

  return new Proxy(object, {
    get(target, prop, value) {
      if (prop in decorator) {
        return decorator[prop as keyof typeof decorator]
      }
      return Reflect.get(target, prop, value)
    },

    set(target, prop, value, receiver) {
      const initial = Reflect.get(target, prop, receiver)

      if (prop in $initial) {
        if (isEqual($initial[prop], value)) delete $initial[prop]
      } else {
        if (isEqual(initial, value)) return true
        $initial[prop as keyof T] = initial
      }

      return Reflect.set(target, prop, value, receiver)
    },
  }) as T & DirtyDecorator<T>
}

export default trackDirty
