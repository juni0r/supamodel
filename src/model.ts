import { SupabaseClient } from '@supabase/supabase-js'

import { asData, failWith, pluralize, identity, DirtyDict, Dict } from './util'
import { defaultsOf, zodSchemaOf } from './schema'
import { Issues } from './issues'
import {
  SupamodelError,
  RecordNotFound,
  RecordInvalid,
  RecordNotSaved,
  RecordNotDeleted,
} from './errors'

import merge from 'lodash.merge'
import result from 'lodash.result'
import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'

import type {
  ModelOptions,
  Attributes,
  Transform,
  TransformsOf,
  ZodObjectOf,
  DefaultsOf,
  SchemaOf,
  ScopeOf,
  FilterBuilder,
  KeyMapper,
  Scoped,
  ToJSON,
  Extend,
  ID,
} from './types'

export class Model {
  static client: SupabaseClient<any, any, any>
  static schema: ZodObjectOf<Attributes>
  static transforms: Dict<Transform>
  static defaults: DefaultsOf<Attributes>
  static naming: KeyMapper
  static primaryKey: string
  static scope: Dict

  static get tableName() {
    return (this.tableName = pluralize(this.naming(this.name)))
  }

  static set tableName(value: string) {
    Object.defineProperty(this, 'tableName', { value, enumerable: true })
  }

  // This constructor signature is required in order to use BaseModel as a
  // mixin class (i.e. defining an anonymous class that extends BaseModel).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: any[]) {}

  $attributes = DirtyDict()

  get $model() {
    return this.constructor as typeof Model
  }

  get $id() {
    return this[this.$model.primaryKey as keyof this] as ID
  }

  get $isPersisted() {
    return this.$id !== undefined
  }

  get $isDeleted() {
    return false
  }

  $get(key: string) {
    return this.$attributes[key]
  }

  $set(key: string, value: unknown) {
    this.$attributes[key] = value
  }

  $assign<T extends Model>(this: T, values: Dict) {
    return Object.assign(this, values)
  }

  get $isDirty() {
    return this.$attributes.$isDirty
  }

  get $changes() {
    return this.$attributes.$changes
  }

  $didChange(key: string) {
    return this.$attributes.$didChange(key)
  }

  $initial(key: string) {
    return key in this.$attributes.$initial
      ? this.$attributes.$initial[key]
      : this.$attributes[key]
  }

  $commit<T extends Model>(this: T) {
    this.$attributes.$commit()
    return this
  }

  $revert<T extends Model>(this: T) {
    this.$attributes.$revert()
    return this
  }

  $emit({ onlyChanges = false }: { onlyChanges?: boolean } = {}) {
    const { transforms } = this.$model

    return mapValues(
      onlyChanges ? this.$attributes.$changes : this.$attributes,
      (value, column) => transforms[column].emit(value),
    )
  }

  $take<T extends Model>(this: T, values: Dict) {
    forEach(this.$model.transforms, ({ column, take }, key) => {
      if (column in values) {
        this.$attributes[key] = take(values[column])
      }
    })
    this.$attributes.$commit()
    return this
  }

  $takeDefaults<T extends Model>(this: T, values?: Dict) {
    if (values) this.$take(values)

    const { defaults } = this.$model

    for (const key in defaults) {
      if (this.$get(key) === undefined) {
        this.$set(key, defaults[key]())
      }
    }
    return this
  }

  $parse() {
    return this.$model.schema.parse(this)
  }

  validate() {
    try {
      Object.assign(this, this.$parse())
    } catch (error) {
      return Issues.handle(error)
    }
    return Issues.None
  }

  async save<T extends Model>(
    this: T,
    {
      validate = true,
      onlyChanges = true,
    }: { validate?: boolean; onlyChanges?: boolean } = {},
  ) {
    const record = this.$emit({ onlyChanges })
    if (onlyChanges && !this.$isDirty) return asData(this)

    if (validate) {
      const issues = this.validate()
      if (issues.any) return failWith(RecordInvalid, issues)
    }

    const { table, primaryKey } = this.$model

    const { error, data } = await (this.$isPersisted
      ? table.update(record).eq(primaryKey, this.$id)
      : table.insert(record)
    )
      .select()
      .maybeSingle()

    return error ? failWith(RecordNotSaved, error) : asData(this.$take(data))
  }

  async updateAttributes<T extends Model>(
    this: T,
    values: Record<keyof T, any>,
    { validate = false }: { validate?: boolean } = {},
  ) {
    return this.$assign(values).save({ validate })
  }

  async delete<T extends Model>(this: T) {
    this.$attributes.$revert()

    const { error } = await this.$model.delete(this.$id)

    if (error) {
      return failWith(RecordNotDeleted, error)
    }

    Object.defineProperty(this, '$isDeleted', { value: true })

    return asData(this)
  }

  toJSON(): ToJSON {
    return Object.entries(this.$attributes).reduce(
      (json, [key, value]) => ({
        ...json,
        [key]: result(value, 'toJSON', value),
      }),
      {},
    )
  }

  static take<T extends typeof Model>(this: T, values: Dict) {
    return new this().$take(values) as InstanceType<T>
  }

  static takeDefaults<T extends typeof Model>(this: T, values?: Dict) {
    return new this().$takeDefaults(values) as InstanceType<T>
  }

  static scoped<T>(filter: FilterBuilder<T>): FilterBuilder<T> {
    return Object.entries(this.scope).reduce(
      (where, [key, value]) => where.eq(key, value),
      filter,
    )
  }

  static get table() {
    return this.client.from(this.tableName)
  }

  static insert(record: Dict) {
    return this.table.insert(record)
  }

  static select<T extends typeof Model>(this: T, columns = '*' as const) {
    return this.scoped(this.table.select<typeof columns, T>(columns))
  }

  static update(id: ID, record: Dict) {
    return this.client
      .from(this.tableName)
      .update(record)
      .eq(String(this.primaryKey), id)
  }

  static delete(id: ID) {
    return this.client
      .from(this.tableName)
      .delete()
      .eq(String(this.primaryKey), id)
  }

  static async findAll<T extends typeof Model>(this: T, scoped?: Scoped) {
    let query = this.select()
    if (scoped) query = scoped(query)

    const { error, data } = await query
    if (error) return failWith(SupamodelError, error)

    return asData(
      data.map((record) => new this().$take(record) as InstanceType<T>),
    )
  }

  static async findOne<T extends typeof Model>(this: T, scoped?: Scoped) {
    let query = this.select()
    if (scoped) query = scoped(query)

    const { data, error } = await query.maybeSingle()

    if (error) {
      return failWith(SupamodelError, error)
    }

    return asData(data && (new this().$take(data) as InstanceType<T>))
  }

  static async find<T extends typeof Model>(this: T, id: ID) {
    const { data, error } = await this.findOne((where) =>
      where.eq(String(this.primaryKey), id),
    )
    return data
      ? asData(data)
      : failWith(RecordNotFound, this.tableName, id, error?.cause)
  }

  static async withClient<DB = any>(
    this: typeof Model,
    client: SupabaseClient<DB>,
    result: () => any,
  ) {
    const ownClient = Object.getOwnPropertyDescriptor(this, 'client')?.value
    try {
      this.client = client
      return await result()
    } finally {
      if (ownClient) this.client = ownClient
      else delete (this as any).client
    }
  }

  static defineAttributes<T extends Attributes>(attributes: T) {
    this.schema = zodSchemaOf(attributes)
    this.defaults = defaultsOf(attributes)
    this.transforms = Dict()
    this.scope = Dict()

    forEach(attributes, ({ column, take, emit }, key) => {
      this.transforms[key] = {
        column: column ?? this.naming(key),
        take: take ?? identity,
        emit: emit ?? identity,
      }

      Object.defineProperty(this.prototype, key, {
        get() {
          return this.$get(key)
        },
        set(value: unknown) {
          this.$set(key, value)
        },
      })
    })
  }

  static configure(options: Partial<ModelOptions>) {
    return merge(this, options)
  }

  static extend<T extends typeof Model, Attrs extends Attributes>(
    this: T,
    attributes: Attrs,
    options: Partial<ModelOptions> = {},
  ) {
    class model extends this {}

    model.configure(options)
    model.defineAttributes(attributes)

    type Schema = SchemaOf<Attrs>
    type Model = Extend<
      typeof model,
      {
        new (...args: any[]): Extend<
          model,
          {
            $model: Model
            $attributes: DirtyDict<Schema>
            $get<K extends keyof Schema>(key: K): Schema[K]
            $set<K extends keyof Schema>(key: K, value: Schema[K]): void
            $initial<K extends keyof Schema>(key: K): Schema[K]
            $didChange<K extends keyof Schema>(key: K): boolean
          }
        > &
          Schema
        schema: ZodObjectOf<Attrs>
        defaults: DefaultsOf<Attrs>
        transforms: TransformsOf<Attrs>
        scope: ScopeOf<Attrs>
      }
    >
    return model as Model
  }
}
export default Model
