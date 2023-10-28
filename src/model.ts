import type { Simplify } from 'type-fest'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
export { createClient, type SupabaseClient }

import { object } from 'zod'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

import {
  Empty,
  assign,
  keysOf,
  hasOwnKey,
  defineProperty,
  pluralize,
  snakeCase,
  identity,
  hasKeyProxy,
} from './util'

import { Implements } from './types'
import type {
  Model,
  ModelClass,
  ModelConfig,
  ModelOptions,
  SchemaFrom,
  ZodShapeFrom,
  Transform,
  Attributes,
  AsAttributes,
  FilterBuilder,
  EmitOptions,
  AnyObject,
  Json,
  KeyMap,
} from './types'

import Issues from './issues'

export { attr } from './util'
export * from './schema'

const modelOptions = Empty<ModelConfig>()

export function defineModelConfig(options: ModelConfig) {
  assign(modelOptions, options)
}

export function defineModel<A = Attributes>(
  attributes: AsAttributes<A>,
  options: ModelOptions = {},
) {
  options = { ...modelOptions, ...options }

  type Attrs = typeof attributes
  type Schema = SchemaFrom<Attrs>

  @Implements<ModelClass<Attrs>>()
  class model implements Model<Attrs> {
    static client = options.client!
    static attributes = attributes
    static transforms = Empty<AnyObject<Transform>>()
    static schema = object(mapValues(attributes, 'type') as ZodShapeFrom<Attrs>)
    static naming = options.naming ?? snakeCase
    static primaryKey = (options.primaryKey ?? 'id') as keyof Attrs
    static get tableName() {
      const value = options.tableName ?? pluralize(this.naming(this.name))
      defineProperty(this, 'tableName', { value })
      return value
    }
    static attributeToColumn = Empty<KeyMap>()
    static columnToAttribute = Empty<KeyMap>()

    get $id() {
      return this[model.primaryKey as keyof this] as string | number
    }

    $attributes = Empty<AnyObject>()
    $dirty: Partial<Schema>
    $changed: Record<keyof Schema, boolean>

    constructor(value?: AnyObject) {
      this.$commit()
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

    $reset() {
      if (this.$isDirty) {
        const { attributeToColumn } = this.$model
        forEach(
          this.$dirty,
          (value, key) => (this.$attributes[attributeToColumn[key]] = value),
        )
      }
      this.$commit()
    }

    $get<K extends keyof Schema>(key: K) {
      return this.$attributes[
        this.$model.attributeToColumn[key as string]
      ] as Schema[K]
    }

    $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const column = this.$model.attributeToColumn[key as string]

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
      const { transforms, columnToAttribute } = this.$model

      forEach(values, (value, column) => {
        const key = columnToAttribute[column] as keyof Attrs

        value = hasOwnKey(transforms, column)
          ? transforms[column].take(value)
          : value

        if (hasOwnKey(this.$dirty, key)) {
          this.$dirty[key] = value
        } else {
          this.$attributes[column] = value
        }
      })
    }

    $emit({ onlyDirty = false }: EmitOptions = {}) {
      const { attributes, transforms } = this.$model

      const keys = onlyDirty
        ? keysOf(this.$dirty).map((key) => attributes[key].column)
        : keysOf(this.$attributes)

      return keys.reduce((transformed, key) => {
        return {
          ...transformed,
          [key]: hasOwnKey(transforms, key)
            ? transforms[key].emit(this.$attributes[key])
            : this.$attributes[key],
        }
      }, {})
    }

    $parse() {
      return this.$model.schema.parse(this)
    }

    validate() {
      try {
        assign(this, this.$parse())
      } catch (error) {
        return Issues.handle(error)
      }
      return Issues.none()
    }

    async save() {
      if (!this.$isDirty) return Issues.none()

      const issues = this.validate()
      if (issues.any) return issues

      const record = this.$emit({ onlyDirty: true })

      const { client, tableName, primaryKey } = this.$model

      const { error, data } = await (!this.$isPersisted
        ? client.from(tableName).insert(record)
        : client
            .from(tableName)
            .update(record)
            .eq(primaryKey as string, this.$id)
      )
        .select()
        .single()

      if (error) throw error

      this.$reset()
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
      const query = this.client.from(this.tableName).select()

      const { error, data } = await (scoped?.(query) ?? query)
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
  }

  const { prototype, transforms, attributeToColumn, columnToAttribute } = model

  forEach(attributes, (option, key) => {
    const column = (option.column ||= model.naming(key))

    attributeToColumn[key] = column
    columnToAttribute[column] = key

    if (option.primary) {
      model.primaryKey = key as keyof Attrs
    }

    if (option.take || option.emit) {
      transforms[column] = {
        take: option.take ?? identity,
        emit: option.emit ?? identity,
      }
    }

    return defineProperty(prototype, key, {
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
