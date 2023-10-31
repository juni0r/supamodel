/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodObject, ZodSchema, TypeOf } from 'zod'

import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  GenericSchema,
  GenericTable,
  GenericView,
} from '@supabase/supabase-js/dist/module/lib/types'

import type {
  PostgrestFilterBuilder,
  PostgrestQueryBuilder,
} from '@supabase/postgrest-js'

import type Issues from './issues'

export function staticImplements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = any> {
  [key: anyKey]: T
}

export type anyKey = string | number | symbol
export type mayBe<T> = T | null | undefined

export type Id = string | number

export interface ModelOptions<Db = any> extends Partial<ModelConfig<Db>> {
  tableName?: string
}

export interface ModelConfig<Db = any> {
  client: SupabaseClient<Db>
  primaryKey?: string
  naming?: KeyMapper
}

export interface ModelClass<Attrs extends Attributes = Attributes> {
  new (...args: any[]): Model<Attrs>

  client: SupabaseClient
  attributes: Attributes
  transforms: AnyObject<Transform>
  schema: ZodObject<ShapeOf<Attrs>>
  primaryKey: string & keyof Attrs
  tableName: string
  naming: KeyMapper
  attributeToColumn: Record<anyKey, string>
  columnToAttribute: Record<string, anyKey>
  scoped(scope: FilterBuilder): FilterBuilder
  find(id: Id): Promise<Model<Attrs>>
  findAll(scoped?: Scoped): Promise<Model<Attrs>[]>
  insert(record: AnyObject): FilterBuilder
  update(id: Id, record: AnyObject): FilterBuilder
  delete(id: Id): FilterBuilder
  defaults(): SchemaOf<Attrs>
}

export interface Model<Attrs extends Attributes = Attributes> {
  $model: ModelClass<Attrs>

  $id: Id
  $attributes: AnyObject
  $dirty: Partial<SchemaOf<Attrs>>
  $changed: Changed<SchemaOf<Attrs>>

  $isDirty: boolean
  $isPersisted: boolean
  $isNewRecord: boolean

  $get<K extends keyof anyKey>(key: K): SchemaOf<Attrs>[K]
  $set<K extends keyof anyKey>(key: K, value: SchemaOf<Attrs>[K]): void
  $emit(options?: { onlyDirty?: boolean }): AnyObject
  $take(values: AnyObject): void
  $takeDefaults(): void
  $parse(): SchemaOf<Attrs>
  $commit(): void
  $reset(): void
  validate(): Issues
  save<C extends this>(this: C): Promise<Issues>
  delete<C extends this>(this: C): Promise<void>
  toJSON(): ToJSON
}

export interface Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export interface Attributes {
  [key: string]: Attribute
}

export type AttributeOptions<Z extends ZodSchema> = Partial<
  Omit<Attribute<Z>, 'type'>
>

export type AsAttributes<T = any> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k] : never
}

export type SchemaOf<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? TypeOf<T[k]['type']> : never
}

export type ShapeOf<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export type Changed<T> = {
  [k in keyof T]: boolean
}

export interface KeyMapper {
  (key: anyKey): string
}

export interface Transform {
  take: (v: any) => any
  emit: (v: any) => any
}

export interface Scoped<T = any> {
  (scope: FilterBuilder<T>): FilterBuilder<T>
}

export type FilterBuilder<
  Result = any,
  Schema extends GenericSchema = any,
  Row extends Record<string, unknown> = any,
  Relationships = unknown,
> = PostgrestFilterBuilder<Schema, Row, Result, Relationships>

export type QueryBuilder<
  Schema extends GenericSchema = any,
  Relation extends GenericTable | GenericView = any,
  Relationships = unknown,
> = PostgrestQueryBuilder<Schema, Relation, Relationships>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface ToJSON {
  [key: string]: Json | undefined
}
