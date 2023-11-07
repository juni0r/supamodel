import { SupabaseClient } from '@supabase/supabase-js'

import { Issues } from './issues'
import { defaults } from './schema'
import { pluralize, TrackedDirty, failWith, asData, Dict } from './util'
import {
  SupamodelError,
  RecordNotFound,
  RecordInvalid,
  RecordNotSaved,
  RecordNotDeleted,
} from './errors'

import result from 'lodash.result'
import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'

import type {
  Attributes,
  AnyObject,
  KeyMapper,
  ZodSchemaOf,
  FilterBuilder,
  Scoped,
  ToJSON,
  ID,
  Transform,
} from './types'

export class BaseModel {
  static client: SupabaseClient<any, any, any>
  static attributes: Attributes
  static transforms: Dict<Transform>
  static schema: ZodSchemaOf<Attributes>
  static naming: KeyMapper
  static primaryKey: string

  static get tableName() {
    return (this.tableName = pluralize(this.naming(this.name)))
  }

  static set tableName(value: string) {
    Object.defineProperty(this, 'tableName', { value, enumerable: true })
  }

  $attributes = TrackedDirty()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: any[]) {}

  get $model() {
    return this.constructor as typeof BaseModel
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

  get $isDirty() {
    return this.$attributes.$isDirty
  }

  $didChange(key: string) {
    return this.$attributes.$didChange(key)
  }

  $initial(key: string) {
    return key in this.$attributes.$initial
      ? this.$attributes.$initial[key]
      : this.$attributes[key]
  }

  $take<T extends BaseModel>(this: T, values: AnyObject) {
    forEach(this.$model.transforms, ({ column, take }, key) => {
      if (column in values) this.$attributes[key] = take(values[column])
    })
    this.$attributes.$commit()
    return this
  }

  $emit({ onlyChanges = false }: { onlyChanges?: boolean } = {}) {
    const { transforms } = this.$model

    return mapValues(
      onlyChanges ? this.$attributes.$changes : this.$attributes,
      (value, column) => transforms[column].emit(value),
    )
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

  async save<T extends BaseModel>(this: T) {
    const issues = this.validate()
    if (issues.any) {
      return failWith(RecordInvalid, issues)
    }

    const { client, tableName, primaryKey } = this.$model

    const table = client.from(tableName)
    const record = this.$emit({ onlyChanges: true })

    const { error, data } = await (this.$isPersisted
      ? table.update(record).eq(primaryKey, this.$id)
      : table.insert(record)
    )
      .select()
      .maybeSingle()

    if (error) {
      return failWith(RecordNotSaved, error)
    }

    this.$attributes.$commit()
    this.$take(data)

    return asData(this)
  }

  async delete<T extends BaseModel>(this: T) {
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

  static defaults() {
    return defaults(this.schema)
  }

  static take<T extends typeof BaseModel>(this: T, values: AnyObject) {
    return new this().$take(values) as InstanceType<T>
  }

  static scoped<T>(filter: FilterBuilder<T>): FilterBuilder<T> {
    return filter
  }

  static select<T extends typeof BaseModel>(this: T, columns = '*' as const) {
    return this.scoped(
      this.client.from(this.tableName).select<typeof columns, T>(columns),
    )
  }

  static insert(record: AnyObject) {
    return this.client.from(this.tableName).insert(record)
  }

  static update(id: ID, record: AnyObject) {
    return this.client
      .from(this.tableName)
      .update(record)
      .eq(String(this.primaryKey), id)
  }

  static delete(id: ID) {
    return this.scoped(
      this.client.from(this.tableName).delete().eq(String(this.primaryKey), id),
    )
  }

  static async findAll<T extends typeof BaseModel>(this: T, scoped?: Scoped) {
    let query = this.select()

    if (scoped) query = scoped(query)

    const { error, data } = await query
    if (error) return failWith(SupamodelError, error)

    return asData(
      data.map((record) => new this().$take(record) as InstanceType<T>),
    )
  }

  static async find<T extends typeof BaseModel>(this: T, id: ID) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq(String(this.primaryKey), id)
      .maybeSingle()

    if (!data) {
      return failWith(RecordNotFound, this.tableName, id, error)
    }

    return asData(new this().$take(data) as InstanceType<T>)
  }

  static async withClient<DB = any>(
    this: typeof BaseModel,
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
}
export default BaseModel
