import { SupabaseClient } from '@supabase/supabase-js'

import { Issues } from './issues'
import {
  asData,
  failWith,
  pluralize,
  TrackedDirty,
  type Dict,
  type DirtyDict,
} from './util'
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

import type { TypeOf } from 'zod'

import type {
  Attributes,
  KeyMapper,
  Transform,
  ZodSchemaOf,
  DefaultsOf,
  FilterBuilder,
  Scoped,
  AnyObject,
  ToJSON,
  ID,
} from './types'

export class BaseModel {
  static client: SupabaseClient<any, any, any>
  static attributes: Attributes
  static transforms: Dict<Transform>
  static schema: ZodSchemaOf<Attributes>
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

  $attributes: TypeOf<ZodSchemaOf<Attributes>> & DirtyDict

  // This constructor signature is required in order to use BaseModel as a
  // mixin class (i.e. defining an anonymous class that extends BaseModel).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: any[]) {
    this.$attributes = TrackedDirty()
  }

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

  $assign<T extends BaseModel>(this: T, values: Dict) {
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

  $commit<T extends BaseModel>(this: T) {
    this.$attributes.$commit()
    return this
  }

  $revert<T extends BaseModel>(this: T) {
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

  $take<T extends BaseModel>(this: T, values: AnyObject) {
    forEach(this.$model.transforms, ({ column, take }, key) => {
      if (column in values) this.$attributes[key] = take(values[column])
    })
    this.$attributes.$commit()
    return this
  }

  $takeDefaults<T extends BaseModel>(this: T, values?: AnyObject) {
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

  async save<T extends BaseModel>(
    this: T,
    {
      validate = true,
      onlyChanges = true,
    }: { validate?: boolean; onlyChanges?: boolean } = {},
  ) {
    if (onlyChanges && !this.$isDirty) return asData(this)

    if (validate) {
      const issues = this.validate()
      if (issues.any) return failWith(RecordInvalid, issues)
    }

    const { client, tableName, primaryKey } = this.$model

    const table = client.from(tableName)
    const record = this.$emit({ onlyChanges })

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

  async updateAttributes<T extends BaseModel>(
    this: T,
    values: Record<keyof T, any>,
    { validate = false }: { validate?: boolean } = {},
  ) {
    return this.$assign(values).save({ validate })
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

  static take<T extends typeof BaseModel>(this: T, values: AnyObject) {
    return new this().$take(values) as InstanceType<T>
  }

  static takeDefaults<T extends typeof BaseModel>(this: T, values?: AnyObject) {
    return new this().$takeDefaults(values) as InstanceType<T>
  }

  static scoped<T>(filter: FilterBuilder<T>): FilterBuilder<T> {
    return Object.entries(this.scope).reduce(
      (where, [key, value]) => where.eq(key, value),
      filter,
    )
  }

  static insert(record: AnyObject) {
    return this.client.from(this.tableName).insert(record)
  }

  static select<T extends typeof BaseModel>(this: T, columns = '*' as const) {
    return this.scoped(
      this.client.from(this.tableName).select<typeof columns, T>(columns),
    )
  }

  static update(id: ID, record: AnyObject) {
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

  static async findAll<T extends typeof BaseModel>(this: T, scoped?: Scoped) {
    let query = this.select()
    if (scoped) query = scoped(query)

    const { error, data } = await query
    if (error) return failWith(SupamodelError, error)

    return asData(
      data.map((record) => new this().$take(record) as InstanceType<T>),
    )
  }

  static async findOne<T extends typeof BaseModel>(this: T, scoped?: Scoped) {
    let query = this.select()
    if (scoped) query = scoped(query)

    const { data, error } = await query.maybeSingle()

    if (error) {
      return failWith(SupamodelError, error)
    }

    return asData(data && (new this().$take(data) as InstanceType<T>))
  }

  static async find<T extends typeof BaseModel>(this: T, id: ID) {
    const { data, error } = await this.findOne((where) =>
      where.eq(String(this.primaryKey), id),
    )
    return data
      ? asData(data)
      : failWith(RecordNotFound, this.tableName, id, error?.cause)
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
