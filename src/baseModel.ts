/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'
import Issues from './issues'
import { defaults } from './schema'
import { New, pluralize } from './util'
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

  $attributes = New<Record<string, any>>()

  get $model() {
    return this.constructor as typeof BaseModel
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

  $take<T extends BaseModel>(this: T, values: AnyObject) {
    const { transforms } = this.$model
    forEach(
      values,
      (value, column) =>
        (this.$attributes[column] = transforms[column].take(value)),
    )

    return this
  }

  $emit() {
    const { transforms } = this.$model

    return mapValues(this.$attributes, (value, column) =>
      transforms[column].emit(value),
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

    const record = this.$emit()

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

    return data.map((record) => new this().$take(record))
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
