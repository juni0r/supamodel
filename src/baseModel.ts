import { SupabaseClient } from './supabase'

import { Issues } from './issues'
import { defaults } from './schema'
import { pluralize, TrackedDirty, type Dict } from './util'
import {
  DatabaseError,
  RecordNotCreated,
  RecordNotDeleted,
  RecordNotFound,
  RecordNotUpdated,
} from './errors'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'

import type {
  Attributes,
  AnyObject,
  KeyMapper,
  Transform,
  ZodSchemaOf,
  FilterBuilder,
  Scoped,
  ToJSON,
  ID,
} from './types'

export class BaseModel {
  static client: SupabaseClient<any, any, any>
  static serviceClient?: SupabaseClient<any, any, any>

  static attributes: Attributes
  static schema: ZodSchemaOf<Attributes>
  static transforms: Dict<Transform>
  static naming: KeyMapper
  static primaryKey: string

  static columnNameOf: Dict<string>
  static attributeNameOf: Dict<string>

  static get tableName() {
    return (this.tableName = pluralize(this.naming(this.name)))
  }

  static set tableName(value: string) {
    Object.defineProperty(this, 'tableName', { value, enumerable: true })
  }

  $attributes = TrackedDirty()

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

  $get(attr: string) {
    return this.$attributes[this.$model.columnNameOf[attr]]
  }

  $set(attr: string, value: unknown) {
    this.$attributes[this.$model.columnNameOf[attr]] = value
  }

  get $isDirty() {
    return this.$attributes.$isDirty
  }

  $didChange(attr: string) {
    return this.$attributes.$didChange(this.$model.columnNameOf[attr])
  }

  $initial(attr: string) {
    const column = this.$model.columnNameOf[attr]

    return column in this.$attributes.$initial
      ? this.$attributes.$initial[column]
      : this.$attributes[column]
  }

  $take<T extends BaseModel>(this: T, values: AnyObject) {
    const { transforms } = this.$model

    forEach(values, (value, column) => {
      this.$attributes[column] = transforms[column].take(value)
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
    return Issues.none()
  }

  async save() {
    const issues = this.validate()
    if (issues.any) return issues

    const { client, tableName, primaryKey } = this.$model

    const table = client.from(tableName)
    const record = this.$emit({ onlyChanges: true })

    const { error, data } = await (this.$isPersisted
      ? table.update(record).eq(primaryKey, this.$id)
      : table.insert(record)
    )
      .select()
      .maybeSingle()

    if (error)
      throw this.$isPersisted
        ? new RecordNotUpdated(error)
        : new RecordNotCreated(error)

    this.$attributes.$commit()
    this.$take(data)

    return issues
  }

  async delete() {
    const { error } = await this.$model.delete(this.$id)
    if (error) throw new RecordNotDeleted(error)
    this.$attributes.$revert()
  }

  toJSON(): ToJSON {
    const { attributeNameOf } = this.$model

    return Object.entries(this.$attributes).reduce(
      (json, [column, value]) => ({
        ...json,
        [attributeNameOf[column]]: value,
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

  static scoped<T = AnyObject>(filter: FilterBuilder<T>): FilterBuilder<T> {
    return filter
  }

  static select(columns?: string) {
    return this.scoped(this.client.from(this.tableName).select(columns))
  }

  static insert(record: AnyObject) {
    return this.client.from(this.tableName).insert(record)
  }

  static update(id: ID, record: AnyObject) {
    return this.scoped(
      this.client
        .from(this.tableName)
        .update(record)
        .eq(String(this.primaryKey), id),
    )
  }

  static delete(id: ID) {
    return this.scoped(
      this.client.from(this.tableName).delete().eq(String(this.primaryKey), id),
    )
  }

  static async findAll(scoped?: Scoped) {
    let query = this.select()

    if (scoped) query = scoped(query)

    const { error, data } = await query
    if (error) throw error

    return data.map((record) => {
      return new this().$take(record)
    })
  }

  static async find<T extends typeof BaseModel>(this: T, id: ID) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq(String(this.primaryKey), id)
      .maybeSingle()

    if (error) throw new DatabaseError(error)
    if (!data) throw new RecordNotFound(this.tableName, id)

    return new this().$take(data) as InstanceType<T>
  }

  static async withServiceRole<Result = unknown>(
    this: typeof BaseModel,
    result: () => Result,
  ) {
    if (!this.serviceClient)
      throw new Error('Service client is not configured.')

    const ownClient = Object.getOwnPropertyDescriptor(this, 'client')?.value

    try {
      this.client = this.serviceClient
      return await result()
    } finally {
      if (ownClient) this.client = ownClient
      else delete (this as any).client
    }
  }
}

export default BaseModel
