/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodIssue, ZodSchema } from 'zod'
import type { Simplify } from 'type-fest'

import type {
  SchemaFrom,
  ShapeFrom,
  Attribute,
  Transform,
  Attributes,
  AnyObject,
  Model,
} from './types'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import snakeCase from 'lodash.snakecase'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

import { ZodError, object } from 'zod'

export * from './schema'

const { hasOwnProperty } = Object.prototype

const identity = (v: any) => v

export const attr = <Z extends ZodSchema>(
  type: Z,
  options?: Partial<Omit<Attribute<Z>, 'type'>>,
) => ({ type, primary: false, column: '', ...options })

export function defineModel<Attrs = Record<string, Attribute>>(
  attributes: Attributes<Attrs>,
) {
  forEach(attributes, (attr, key) => {
    attr.column ||= snakeCase(key)
  })

  type schema = SchemaFrom<typeof attributes>

  class model {
    static $attributes = attributes
    static $transforms: AnyObject<Transform> = {}
    static $schema = object(mapValues(attributes, 'type') as ShapeFrom<Attrs>)

    $attributes: AnyObject = {}
    $dirty: Partial<schema> = {}
    $changed = hasKey(this.$dirty) as Record<keyof schema, boolean>

    constructor(value?: AnyObject) {
      if (value) this.$take(value)
    }

    get $model() {
      return model
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    protected $get<K extends keyof schema>(key: K) {
      return this.$attributes[attributes[key].column] as schema[K]
    }

    protected $set<K extends keyof schema>(key: K, value: schema[K]) {
      const _key = attributes[key].column

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const current = this.$attributes[_key]
        if (!isEqual(value, current)) {
          this.$dirty[key] = current as typeof value
        }
      }
      this.$attributes[_key] = value
    }

    $take(values: AnyObject) {
      forEach(model.$transforms, (transform, key) => {
        values[key] = transform.take(values[key])
      })
      this.$attributes = values
    }

    $emit() {
      const values = { ...this.$attributes }
      forEach(model.$transforms, (transform, key) => {
        values[key] = transform.emit(values[key])
      })
      return values
    }

    async validate() {
      try {
        Object.assign(this, await model.$schema.parseAsync(this))
      } catch (error) {
        if (error instanceof ZodError) {
          return Issues.from(error.issues)
        }
        throw error
      }
      return new Issues()
    }
  }

  const { prototype, $transforms, $attributes } = model

  forEach(attributes, (option, key) => {
    if (option.take || option.emit) {
      $transforms[$attributes[key as keyof schema].column] = {
        take: option.take ?? identity,
        emit: option.emit ?? identity,
      }
    }
    return Object.defineProperty(prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
    })
  })

  return model as Model<typeof attributes> & {
    new (value?: AnyObject): Simplify<model & schema>
  }
}

function hasKey<T extends object = object>(target: T) {
  return new Proxy(target, {
    get: (target, key) => hasOwnProperty.call(target, key),
  })
}

export class Issues extends Array<ZodIssue> {
  static from(issues: ZodIssue[]) {
    return Object.setPrototypeOf(issues, this.prototype) as Issues
  }
  get any() {
    return this.length > 0
  }
  get none() {
    return this.length === 0
  }
}
