import type { Simplify } from 'type-fest'
import type { PostgrestError } from '@supabase/postgrest-js'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
export { createClient, type SupabaseClient }

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'
import pick from 'lodash.pick'

import {
  New,
  assign,
  keysOf,
  hasOwnKey,
  defineProperty,
  pluralize,
  snakeCase,
  hasKeyProxy,
  zodObjectFrom,
} from './util'

import { Implements } from './types'
import type {
  Model,
  ModelClass,
  ModelConfig,
  ModelOptions,
  Attributes,
  AsAttributes,
  SchemaFrom,
  Transform,
  Changed,
  FilterBuilder,
  AnyObject,
  Json,
  Id,
} from './types'

import Issues from './issues'
import fnMap from './fnMap'

export { attr } from './util'
export * from './schema'

const modelOptions = New<ModelConfig>()

export function defineModelConfig(options: ModelConfig) {
  assign(modelOptions, options)
}

export function defineModel<A = Attributes>(
  attributes: AsAttributes<A>,
  options: ModelOptions = {},
) {
  const { naming, primaryKey, tableName, client } = {
    naming: snakeCase,
    primaryKey: 'id',
    ...modelOptions,
    ...options,
  }
  type Attrs = typeof attributes
  type Schema = SchemaFrom<Attrs>

  @Implements<ModelClass<Attrs>>()
  class model implements Model<Attrs> {
    static client = client
    static naming = naming

    static attributes = attributes
    static schema = zodObjectFrom(attributes)
    static transforms = New<AnyObject<Transform>>()

    static attributeToColumn = fnMap<keyof Attrs, string>()
    static columnToAttribute = fnMap<string, keyof Attrs>()

    static get tableName() {
      const value = tableName ?? pluralize(this.naming(this.name))
      defineProperty(this, 'tableName', { value })
      return value
    }
    static primaryKey = primaryKey as string & keyof Attrs

    $attributes = New()

    $dirty: Partial<Schema>
    $changed: Changed<Schema>

    constructor(value?: AnyObject) {
      this.$commit()
      if (value) this.$take(value)
    }

    get $model() {
      return this.constructor as ModelClass<Attrs>
    }

    get $id() {
      return this[model.primaryKey as keyof this] as Id
    }

    get $isPersisted() {
      return this.$id !== undefined
    }

    get $isNewRecord() {
      return this.$id === undefined
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    $commit() {
      this.$dirty = New()
      this.$changed = hasKeyProxy(this.$dirty)
    }

    $reset() {
      if (this.$isDirty) {
        const { attributeToColumn } = this.$model
        forEach(this.$dirty, (value, key) => {
          const column = attributeToColumn(key as keyof Attrs)
          this.$attributes[column] = value
        })
      }
      this.$commit()
    }

    $get<K extends keyof Schema>(key: K) {
      return this.$attributes[this.$model.attributeToColumn(key)]
    }

    $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const column = this.$model.attributeToColumn(key)

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const initialValue = this.$attributes[column]
        if (!isEqual(value, initialValue)) {
          this.$dirty[key] = initialValue
        }
      }
      this.$attributes[column] = value
    }

    $take(values: AnyObject) {
      const { transforms, columnToAttribute } = this.$model

      forEach(values, (value, column) => {
        const key = columnToAttribute(column)

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

    $emit({ onlyDirty = false }: { onlyDirty?: boolean } = {}) {
      const { transforms, attributeToColumn } = this.$model

      let emitted: AnyObject

      if (onlyDirty) {
        const dirtyColumns = keysOf(this.$dirty).map(attributeToColumn)
        emitted = pick(this.$attributes, dirtyColumns)
      } else {
        emitted = this.$attributes
      }

      return mapValues(emitted, (value, key) =>
        hasOwnKey(transforms, key) ? transforms[key].emit(value) : value,
      )
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
      const { client, tableName, primaryKey } = this.$model

      if (!this.$isDirty) {
        return Issues.none()
      }

      const issues = this.validate()
      if (issues.any) {
        return issues
      }

      const record = this.$emit({ onlyDirty: true })

      const { error, data } = await (this.$isNewRecord
        ? client.from(tableName).insert(record)
        : client
            .from(tableName)
            .update(record)
            .eq(primaryKey as string, this.$id)
      )
        .select()
        .single()

      if (error) throw new RecordNotSaved(error, this.$id)

      this.$reset()
      this.$take(data)

      return issues
    }

    toJSON() {
      return mapValues(
        this.$model.attributeToColumn,
        (column) => this.$attributes[column] as Json,
      )
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

    static async find(id: Id) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select()
        .eq(String(this.primaryKey), id)
        .single()

      if (error) throw error
      if (!data) throw new RecordNotFound(this.tableName, id)

      return new this(data)
    }

    static insert(record: AnyObject) {
      return this.client.from(this.tableName).insert(record)
    }

    static update(id: Id, record: AnyObject) {
      return this.client
        .from(this.tableName)
        .update(record)
        .eq(String(this.primaryKey), id)
    }
  }

  const { prototype, transforms, attributeToColumn, columnToAttribute } = model

  forEach(attributes, (option, key) => {
    const column = (option.column ||= model.naming(key))

    attributeToColumn[key] = column
    columnToAttribute[column] = key as keyof Attrs

    if (option.take || option.emit) {
      transforms[column] = {
        take: option.take ?? ((v: unknown) => v),
        emit: option.emit ?? ((v: unknown) => v),
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

export class RecordNotFound extends Error {
  constructor(tableName: string, id: Id) {
    super(`No ${tableName} with primary key ${JSON.stringify(id)}`) // (1)
    this.name = 'RecordNotFound' // (2)
  }
}

export class RecordNotSaved extends Error implements PostgrestError {
  details: string
  hint: string
  code: string

  constructor({ message, ...error }: PostgrestError, id: Id) {
    const saved = id ? 'updated' : 'created'
    super(`Record not ${saved} with primary key ${id} (${message})`) // (1)
    assign(this, error, { name: 'RecordNotSaved' }) // (3)
  }
}
