import { SupabaseClient } from '@supabase/supabase-js'

import type Base from './base'
import { asData, failWith, pluralize, Dict } from '../util'
import {
  SupamodelError,
  RecordNotFound,
  RecordInvalid,
  RecordNotSaved,
  RecordNotDeleted,
} from '../errors'

import type { FilterBuilder, Scoped, ID } from '../types'

export interface Config {
  client: SupabaseClient
  primaryKey: string
}

export const defaults: Omit<Config, 'client'> = {
  primaryKey: 'id',
}

interface Options extends Config {
  tableName: string
}

export default (options: Partial<Options> = {}) => {
  const { client, tableName, primaryKey } = { ...defaults, ...options }

  return function mixin<T extends typeof Base>(base: T) {
    type PersistenceClass = typeof Persistence

    class Persistence extends base {
      static client = client!
      static primaryKey = primaryKey

      /**
       * If a Model subclass doesn't define tableName as an own property, the
       * property will be defined by - and subsequently override - the getter.
       * The default value for tableName is the pluralized subclass name.
       */
      static get tableName() {
        return (this.tableName = tableName ?? pluralize(this.naming(this.name)))
      }

      /**
       * The setter for tableName simply defines a static own property on the
       * respective subclass. It should be used to explicitely set the tableName
       * on the subclass and prevent the default assignment from Model.
       */
      static set tableName(value: string) {
        Object.defineProperty(this, 'tableName', { value, enumerable: true })
      }

      get $model() {
        return this.constructor as typeof Persistence
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

      async save<T extends Persistence>(
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

        return error
          ? failWith(RecordNotSaved, error)
          : asData(this.$take(data))
      }

      async updateAttributes<T extends Persistence>(
        this: T,
        values: Record<keyof T, any>,
        { validate = false }: { validate?: boolean } = {},
      ) {
        Object.assign(this, values)
        return this.save({ validate })
      }

      async delete<T extends Persistence>(this: T) {
        this.$attributes.$revert()

        const { error } = await this.$model.delete(this.$id)

        if (error) {
          return failWith(RecordNotDeleted, error)
        }

        Object.defineProperty(this, '$isDeleted', { value: true })

        return asData(this)
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

      static select<T extends PersistenceClass>(
        this: T,
        columns = '*' as const,
      ) {
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

      static async findAll<T extends PersistenceClass>(
        this: T,
        scoped?: Scoped,
      ) {
        let query = this.select()
        if (scoped) query = scoped(query)

        const { error, data } = await query
        if (error) return failWith(SupamodelError, error)

        return asData(
          data.map((record) => new this().$take(record) as InstanceType<T>),
        )
      }

      static async findOne<T extends PersistenceClass>(
        this: T,
        scoped?: Scoped,
      ) {
        let query = this.select()
        if (scoped) query = scoped(query)

        const { data, error } = await query.maybeSingle()

        if (error) {
          return failWith(SupamodelError, error)
        }

        return asData(data && (new this().$take(data) as InstanceType<T>))
      }

      static async find<T extends PersistenceClass>(this: T, id: ID) {
        const { data, error } = await this.findOne((where) =>
          where.eq(String(this.primaryKey), id),
        )
        return data
          ? asData(data)
          : failWith(RecordNotFound, this.tableName, id, error?.cause)
      }

      static async withClient<DB = any>(
        this: PersistenceClass,
        client: SupabaseClient<DB>,
        result: () => any,
      ) {
        const ownClient = Object.getOwnPropertyDescriptor(this, 'client')?.value
        try {
          this.client = client as any
          return await result()
        } finally {
          if (ownClient) this.client = ownClient
          else delete (this as any).client
        }
      }
    }
    return Persistence
  }
}
