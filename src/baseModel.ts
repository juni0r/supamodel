/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'
import Issues from './issues'
import { defaults } from './schema'
import { pluralize, TrackedDirty } from './util'
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

export class BaseModel<DB = any> {
  static client: SupabaseClient
  static serviceClient: SupabaseClient

  static attributes: Attributes
  static transforms: Record<string, Transform>
  static schema: ZodSchemaOf<Attributes>
  static naming: KeyMapper

  static columnNameOf: Record<string, string>
  static attributeNameOf: Record<string, string>

  static primaryKey: string

  static get tableName() {
    return (this.tableName = pluralize(this.naming(this.name)))
  }
  static set tableName(value: string) {
    Object.defineProperty(this, 'tableName', { value, enumerable: true })
  }

  static async withServiceRole<Result = unknown>(
    this: typeof BaseModel,
    execute: () => Result,
  ) {
    const { client } = this
    this.client = this.serviceClient
    try {
      return await execute()
    } finally {
      this.client = client
    }
  }

  $attributes = TrackedDirty()

  get $model() {
    return this.constructor as typeof BaseModel
  }

  get $client() {
    return this.$model.client as SupabaseClient<DB>
  }

  get $id() {
    return this[this.$model.primaryKey as keyof this] as ID
  }

  get $isPersisted() {
    return this.$id !== undefined
  }

  get $isNewRecord() {
    return this.$id === undefined
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
    const { client, tableName, primaryKey } = this.$model

    const issues = this.validate()
    if (issues.any) {
      return issues
    }

    const record = this.$emit({ onlyChanges: true })

    const { error, data } = await (this.$isNewRecord
      ? client.from(tableName).insert(record)
      : client.from(tableName).update(record).eq(primaryKey, this.$id)
    )
      .select()
      .maybeSingle()

    if (error)
      throw this.$isNewRecord
        ? new RecordNotCreated(error)
        : new RecordNotUpdated(error)

    this.$attributes.$commit()
    this.$take(data)

    return issues
  }

  async delete() {
    const { error } = await this.$model.delete(this.$id)
    if (error) throw new RecordNotDeleted(error)
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

  static async find(id: ID) {
    const { data, error } = await this.client
      .from(this.tableName)
      .select()
      .eq(String(this.primaryKey), id)
      .maybeSingle()

    if (error) throw new DatabaseError(error)
    if (!data) throw new RecordNotFound(this.tableName, id)

    return new this().$take(data)
  }
}

export default BaseModel
