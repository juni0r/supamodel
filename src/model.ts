import type { Simplify } from 'type-fest'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
export { createClient, type SupabaseClient }

import { object, ZodError, type ZodSchema, type ZodIssue } from 'zod'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

import { underscore, pluralize } from 'inflection'

import { Implements } from './types'
import type {
  Model,
  ModelClass,
  ModelConfig,
  ModelOptions,
  SchemaFrom,
  ShapeFrom,
  Transform,
  Attribute,
  Attributes,
  AttributeOptions,
  ValidationIssues,
  AnyObject,
  Json,
  FilterBuilder,
} from './types'

export * from './schema'

const {
  assign,
  defineProperty,
  setPrototypeOf,
  prototype: { hasOwnProperty },
} = Object

const identity = (v: unknown) => v
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

export function defineModelConfig(options: typeof modelOptions) {
  assign(modelOptions, options)
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
    static primaryKey = 'id' as keyof Attrs
    static client = client
    static schema = schema
    static attributes = attributes
    static transforms = Empty<AnyObject<Transform>>()
    static get tableName() {
      const value = tableName ?? pluralize(naming(this.name))
      defineProperty(this, 'tableName', { value })
      return value
    }

    get $id() {
      return this[model.primaryKey as keyof this] as string | number
    }

    $attributes = Empty<AnyObject>()
    $dirty = Empty<Partial<Schema>>()
    $changed = hasKeyProxy(this.$dirty)

    constructor(value?: AnyObject) {
      if (value) this.$take(value)
    }

    get $model() {
      return this.constructor as ModelClass<Attrs>
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    get $isPersisted() {
      return this[this.$model.primaryKey as keyof this] !== undefined
    }

    $commit() {
      this.$dirty = Empty()
      this.$changed = hasKeyProxy(this.$dirty)
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
      this.$attributes = this.$model.transformFor('take', values)
      this.$commit()
    }

    $emit<K extends keyof Schema>(...keys: K[]) {
      return this.$model.transformFor('emit', this.$attributes, keys)
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
      return Issues.none()
    }

    async save() {
      if (!this.$isDirty) return Issues.none()

      const issues = this.validate()
      if (issues.any) return issues

      const record = this.$emit(...keysOf(this.$dirty))

      const { error, data } = await (this.$id === undefined
        ? this.$model.insert(record)
        : this.$model.update(this.$id, record)
      )
        .select()
        .single()

      if (error) throw error

      this.$take(data)
      return issues
    }

    toJSON() {
      return mapValues(attributes, (value) => {
        return this.$attributes[value.column] as Json
      })
    }

    static select(columns?: string) {
      return this.client.from(this.tableName).select(columns)
    }

    static async findAll(scoped?: (scope: FilterBuilder) => FilterBuilder) {
      let select = this.client.from(this.tableName).select()
      if (scoped) select = scoped(select)

      const { error, data } = await select
      if (error) throw error

      return data.map((record) => new this(record))
    }

    static async find(id: string | number) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select()
        .eq(this.primaryKey as string, id)
        .single()

      if (error) throw error
      if (!data) throw new Error(`Record not found (id: ${id})`)

      return new this(data)
    }

    static insert(record: AnyObject) {
      return this.client.from(this.tableName).insert(record)
    }

    static update(id: string | number, record: AnyObject) {
      return this.client
        .from(this.tableName)
        .update(record)
        .eq(this.primaryKey as string, id)
    }

    static transformFor(
      mode: 'take' | 'emit',
      values: AnyObject,
      keys?: (keyof Attrs)[],
    ) {
      const { attributes, transforms } = this

      if (isEmpty(keys)) {
        keys = keysOf(schema.shape)
      }

      return keys!.reduce((transformed, _key) => {
        const key = attributes[_key].column
        const value = values[key]

        if (value === undefined) {
          return transformed
        }

        return {
          ...transformed,
          [key]: hasOwnKey(transforms, key)
            ? transforms[key][mode](value)
            : value,
        }
      }, {} as AnyObject)
    }
  }

  forEach(attributes, (option, key) => {
    if (option.primary) model.primaryKey = key as keyof Attrs

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
    new (...args: unknown[]): Simplify<model & Schema>
  }
}

export class Issues extends Array<ZodIssue> implements ValidationIssues {
  static from(issues: ZodIssue[]) {
    return setPrototypeOf(issues, this.prototype) as Issues
  }
  static none() {
    return this.from([])
  }
  get any() {
    return this.length > 0
  }
  get none() {
    return this.length === 0
  }
}

function hasKeyProxy<T extends object>(object: T) {
  return new Proxy(object, {
    get: (target, key) => hasOwnKey(target, key),
  }) as Record<keyof T, boolean>
}
