import type { Simplify } from 'type-fest'

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
  object,
} from './util'

import { staticImplements } from './types'
import type {
  Model,
  ModelClass,
  ModelConfig,
  ModelOptions,
  Attributes,
  AsAttributes,
  SchemaFrom,
  Transform,
  AnyObject,
  Changed,
  Scoped,
  Json,
  Id,
  FilterBuilder,
  ShapeFrom,
} from './types'

import {
  DatabaseError,
  RecordNotCreated,
  RecordNotDeleted,
  RecordNotFound,
  RecordNotUpdated,
} from './errors'

import Issues from './issues'

import { defaults } from './schema'
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

  @staticImplements<ModelClass<Attrs>>()
  class model implements Model<Attrs> {
    static client = client
    static naming = naming

    static attributes = attributes
    static schema = object(mapValues(attributes, 'type') as ShapeFrom<Attrs>)
    static transforms = New<Record<string, Transform>>()

    static attributeToColumn = New<Record<keyof Attrs, string>>()
    static columnToAttribute = New<Record<string, keyof Attrs>>()

    static get tableName() {
      const value = tableName ?? pluralize(this.naming(this.name))
      defineProperty(this, 'tableName', { value })
      return value
    }
    static primaryKey = primaryKey as string & keyof Attrs

    $attributes = New()

    $dirty!: Partial<Schema>
    $changed!: Changed<Schema>

    constructor(value?: AnyObject) {
      this.$commit()
      if (value) this.$take(value)
      else this.$takeDefaults()
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
      const { attributeToColumn } = this.$model

      if (this.$isDirty) {
        keysOf(this.$dirty).forEach((key) => {
          this.$attributes[attributeToColumn[key]] = this.$dirty[key]
        })
      }
      this.$commit()
    }

    $get<K extends keyof Schema>(key: K) {
      return this.$attributes[this.$model.attributeToColumn[key]]
    }

    $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const column = this.$model.attributeToColumn[key]

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const initial = this.$attributes[column]
        if (!isEqual(value, initial)) {
          this.$dirty[key] = initial
        }
      }
      this.$attributes[column] = value
    }

    $take(values: AnyObject) {
      const { transforms, columnToAttribute } = this.$model

      forEach(values, (value, column) => {
        const key = columnToAttribute[column]

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

    $takeDefaults() {
      this.$take(this.$model.defaults())
    }

    $emit({ onlyDirty = false }: { onlyDirty?: boolean } = {}) {
      const { transforms, attributeToColumn } = this.$model

      let emitted: AnyObject

      if (onlyDirty) {
        const dirtyColumns = keysOf(this.$dirty).map(
          (key) => attributeToColumn[key],
        )
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
        .maybeSingle()

      if (error)
        throw this.$isNewRecord
          ? new RecordNotCreated(error)
          : new RecordNotUpdated(error)

      this.$commit()
      this.$take(data)

      return issues
    }

    async delete() {
      this.$reset()
      const { error } = await this.$model.delete(this.$id)
      if (error) throw new RecordNotDeleted(error)
    }

    toJSON() {
      return mapValues(
        this.$model.attributeToColumn,
        (column) => this.$attributes[column] as Json,
      )
    }

    static defaults() {
      return defaults<Schema>(this.schema)
    }

    static scoped<T = AnyObject>(filter: FilterBuilder<T>): FilterBuilder<T> {
      return filter
    }

    static select(columns?: string) {
      return this.scoped(this.client.from(this.tableName).select(columns))
    }

    static insert(record: AnyObject) {
      return this.client.from(this.tableName).insert(record)
    }

    static update(id: Id, record: AnyObject) {
      return this.scoped(
        this.client
          .from(this.tableName)
          .update(record)
          .eq(String(this.primaryKey), id),
      )
    }

    static delete(id: Id) {
      return this.scoped(
        this.client
          .from(this.tableName)
          .delete()
          .eq(String(this.primaryKey), id),
      )
    }

    static async findAll(scoped?: Scoped) {
      let query = this.select()

      if (scoped) query = scoped(query)

      const { error, data } = await query
      if (error) throw error

      return data.map((record) => new this(record))
    }

    static async find(id: Id) {
      const { data, error } = await this.client
        .from(this.tableName)
        .select()
        .eq(String(this.primaryKey), id)
        .maybeSingle()

      if (error) throw new DatabaseError(error)
      if (!data) throw new RecordNotFound(this.tableName, id)

      return new this(data)
    }
  }

  const { prototype, transforms, attributeToColumn, columnToAttribute } = model

  keysOf(attributes).forEach((key) => {
    const option = attributes[key]
    const column = (option.column ||= model.naming(key))

    attributeToColumn[key] = column
    columnToAttribute[column] = key

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
