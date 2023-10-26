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
  SchemaFrom,
  ShapeFrom,
  Attribute,
  Transform,
  Attributes,
  AnyObject,
  ModelClass,
  AttributeOptions,
  Model,
  Json,
} from './types'
import pick from 'lodash.pick'

export * from './schema'
export { createClient, type SupabaseClient }

const {
  assign,
  defineProperty,
  setPrototypeOf,
  // keys: keysOf,
  prototype: { hasOwnProperty },
} = Object

const identity = (v: any) => v

const modelOptions = {} as {
  client: SupabaseClient
} & ModelConfig

interface ModelOptions<Db = any> extends ModelConfig {
  client?: SupabaseClient<Db>
  tableName?: string
}

interface ModelConfig {
  naming?: (key: string) => string
}

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
  type ModelSchema = ModelClass<Attrs>

  let { naming, client, tableName } = {
    naming: underscore,
    ...modelOptions,
    ...options,
  }

  const schema = object(mapValues(attributes, 'type') as ShapeFrom<Attrs>)

  @Implements<ModelSchema>()
  class model implements Model<Attrs> {
    static client = client
    static schema = schema
    static attributes = attributes
    static transforms: AnyObject<Transform> = {}

    static primaryKey = 'id'
    static get tableName() {
      tableName ??= pluralize(naming(this.name))
      defineProperty(model, 'tableName', { value: tableName })
      return tableName
    }

    $attributes: AnyObject = {}
    $dirty: Partial<Schema> = {}
    $changed = hasKey(this.$dirty) as Record<keyof Schema, boolean>

    constructor(value?: AnyObject) {
      if (value) this.$take(value)
    }

    get $model() {
      return model
    }

    static async find(id: string | number) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq(this.primaryKey, id)

      if (error) throw error

      const record = data[0]

      if (!record) {
        throw new Error(`Record not found (id: ${id})`)
      }
      return new this(record)
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
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
    }

    $emit<K extends keyof Schema>(...keys: K[]) {
      const values =
        keys.length > 0
          ? pick(this.$attributes, ...keys.map(naming as (key: K) => string))
          : { ...this.$attributes }

      forEach(model.transforms, (transform, key) => {
        if (hasOwnProperty.call(values, key))
          values[key] = transform.emit(values[key])
      })
      return values
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
      if (issues.any) return issues

      // const record = this.$emit(...(keysOf(this.$dirty) as (keyof Schema)[]))
    }

    toJSON() {
      return mapValues(attributes, (value) => {
        return this.$attributes[value.column] as Json
      })
    }
  }

  forEach(attributes, (option, key) => {
    if (option.primary) model.primaryKey = key

    option.column ||= naming(key)

    if (option.take || option.emit) {
      model.transforms[attributes[key as keyof Schema].column] = {
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
    return setPrototypeOf(issues, this.prototype) as Issues
  }
  get any() {
    return this.length > 0
  }
  get none() {
    return this.length === 0
  }
}
