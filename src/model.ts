/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { Implements } from './types'
import { object, ZodError } from 'zod'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

import { underscore, pluralize } from 'inflection'

import type { ZodSchema, ZodIssue } from 'zod'
import type { Simplify } from 'type-fest'
import type {
  Attribute,
  Attributes,
  AttributeOptions,
  AnyObject,
  ModelClass,
  ModelConfig,
  ModelOptions,
  SchemaFrom,
  ShapeFrom,
  Transform,
  Model,
  Json,
} from './types'

export * from './schema'
export { createClient, type SupabaseClient }

const {
  assign,
  defineProperty,
  setPrototypeOf,
  prototype: { hasOwnProperty },
} = Object

const identity = (v: any) => v
const snakeCase = (key: string) => underscore(key)
const Empty = <T = object>() => Object.create(null) as T
const hasOwnKey = (object: object, key: symbol | string | number) =>
  hasOwnProperty.call(object, key)
const keysOf = <T extends object>(object: T) =>
  Object.keys(object) as (keyof T)[]

const modelOptions = Empty<
  {
    client: SupabaseClient
  } & ModelConfig
>()

export function defineModelConfig<Db = any>(
  client: SupabaseClient<Db>,
  options?: ModelConfig,
) {
  assign(modelOptions, { client }, options)
}

export const attr = <Z extends ZodSchema>(
  type: Z,
  options?: AttributeOptions<Z>,
) => ({ type, primary: false, column: '', ...options })

export function defineModel<A = Record<string, Attribute>>(
  attributes: Attributes<A>,
  options?: ModelOptions,
) {
  type Attrs = typeof attributes
  type Schema = SchemaFrom<Attrs>

  const { naming, client, tableName } = {
    naming: snakeCase,
    ...modelOptions,
    ...options,
  }

  const schema = object(mapValues(attributes, 'type') as ShapeFrom<Attrs>)

  @Implements<ModelClass<Attrs>>()
  class model implements Model<Attrs> {
    static primaryKey = 'id'
    static client = client
    static schema = schema
    static attributes = attributes
    static transforms = Empty<AnyObject<Transform>>()
    static get tableName() {
      const value = tableName ?? pluralize(naming(this.name))
      defineProperty(model, 'tableName', { value })
      return value
    }

    $attributes = Empty<AnyObject>()
    $dirty = Empty<Partial<Schema>>()

    $changed = new Proxy(this, {
      get: (target, key) => hasOwnKey(target.$dirty, key),
    }) as Record<keyof Attrs, boolean>

    constructor(value?: AnyObject) {
      if (value) this.$take(value)
    }

    get $model() {
      return model
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    $commit() {
      this.$dirty = Empty()
    }

    $get<K extends keyof Schema>(key: K) {
      return this.$attributes[attributes[key].column] as Schema[K]
    }

    $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const { column } = attributes[key]

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const current = this.$attributes[column]
        if (!isEqual(value, current)) {
          this.$dirty[key] = current
        }
      }
      this.$attributes[column] = value
    }

    $take(values: AnyObject) {
      forEach(model.transforms, (transform, key) => {
        values[key] = transform.take(values[key])
      })
      this.$attributes = values
      this.$commit()
    }

    $emit<K extends keyof Schema>(...keys: K[]) {
      const { attributes, transforms } = model

      if (isEmpty(keys)) {
        keys = keysOf(model.schema.shape) as K[]
      }

      return keys.reduce((emit, _key) => {
        const key = attributes[_key].column
        return {
          ...emit,
          [key]: hasOwnKey(transforms, key)
            ? transforms[key].emit(this.$attributes[key])
            : this.$attributes[key],
        }
      }, {} as AnyObject)
    }

    $parse() {
      return schema.parse(this)
    }

    validate() {
      try {
        assign(this, this.$parse())
      } catch (error) {
        if (error instanceof ZodError) {
          return Issues.from(error.issues)
        }
        throw error
      }
      return new Issues()
    }

    async update() {
      const issues = this.validate()
      if (issues.any || !this.$isDirty) return issues

      const id = this[model.primaryKey as keyof this]
      const data = this.$emit(...keysOf(this.$dirty))

      const { data: updates, error } = await client
        .from(model.tableName)
        .update(data)
        .eq(model.primaryKey, id)
        .select()
        .single()

      if (error) throw error

      this.$take(updates)

      return issues
    }

    toJSON() {
      return mapValues(attributes, (value) => {
        return this.$attributes[value.column] as Json
      })
    }

    static async find(id: string | number) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq(this.primaryKey, id)
        .single()

      if (error) throw error
      if (!data) throw new Error(`Record not found (id: ${id})`)

      return new this(data)
    }
  }

  forEach(attributes, (option, key) => {
    if (option.primary) model.primaryKey = key

    option.column ||= naming(key)

    if (option.take || option.emit) {
      model.transforms[attributes[key as keyof Attrs].column] = {
        take: option.take ?? identity,
        emit: option.emit ?? identity,
      }
    }

    return defineProperty(model.prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
    })
  })

  return model as ModelClass<Attrs> & {
    new (...args: any[]): Simplify<model & Schema>
  }
}

export class Issues extends Array<ZodIssue> {
  static from(issues: ZodIssue[]) {
    return setPrototypeOf(issues, this.prototype) as Issues
  }
  get any() {
    return this.length > 0
  }
  get none() {
    return this.length === 0
  }
}
