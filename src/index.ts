/* eslint-disable @typescript-eslint/no-explicit-any */
import { Implements } from './types'
import { object, ZodError } from 'zod'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import snakeCase from 'lodash.snakecase'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

import type { ZodSchema, ZodIssue } from 'zod'
import type { Simplify } from 'type-fest'
import type {
  SchemaFrom,
  ShapeFrom,
  Attribute,
  Transform,
  Attributes,
  AnyObject,
  Model,
  AttributeOptions,
} from './types'

export * from './schema'

const { hasOwnProperty } = Object.prototype

const identity = (v: any) => v

export const attr = <Z extends ZodSchema>(
  type: Z,
  options?: AttributeOptions<Z>,
) => ({ type, primary: false, column: '', ...options })

export function defineModel<A = Record<string, Attribute>>(
  attributes: Attributes<A>,
) {
  const schema = object(mapValues(attributes, 'type') as Shape)

  type Shape = ShapeFrom<typeof attributes>
  type Schema = SchemaFrom<typeof attributes>
  type ModelSchema = Model<typeof attributes, typeof schema>

  @Implements<ModelSchema>()
  class model {
    static $attributes = attributes
    static $schema = schema

    static $transforms: AnyObject<Transform> = {}

    $attributes: AnyObject = {}
    $dirty: Partial<Schema> = {}

    $changed = hasKey(this.$dirty) as Record<keyof Schema, boolean>

    constructor(value?: AnyObject) {
      if (value) this.$take(value)
    }

    get $model() {
      return model
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    protected $get<K extends keyof Schema>(key: K) {
      return this.$attributes[attributes[key].column] as Schema[K]
    }

    protected $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const { column } = attributes[key]

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const current = this.$attributes[column]
        if (!isEqual(value, current)) {
          this.$dirty[key] = current as typeof value
        }
      }
      this.$attributes[column] = value
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

    $parse() {
      return schema.parse(this)
    }

    validate() {
      try {
        Object.assign(this, this.$parse())
      } catch (error) {
        if (error instanceof ZodError) {
          return Issues.from(error.issues)
        }
        throw error
      }
      return new Issues()
    }

    toJSON() {
      return mapValues(attributes, (value) => {
        return this.$attributes[value.column]
      })
    }
  }

  forEach(attributes, (option, key) => {
    option.column ||= snakeCase(key)

    if (option.take || option.emit) {
      model.$transforms[attributes[key as keyof Schema].column] = {
        take: option.take ?? identity,
        emit: option.emit ?? identity,
      }
    }

    return Object.defineProperty(model.prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
    })
  })

  return model as ModelSchema & {
    new (...args: any[]): Simplify<model & Schema>
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
