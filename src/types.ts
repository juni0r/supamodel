/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodObject, TypeOf, ZodSchema } from 'zod'
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

export type Extend<T, E> = Omit<T, keyof E> & E

export interface AnyObject<T = any> {
  [key: anyKey]: T
}

export type anyKey = string | number | symbol
export type mayBe<T> = T | null | undefined

export type ID = string | number

interface SupabaseConfig {
  url: string
  anonKey: string
  serviceKey?: string
}

interface Clients<Db = any> {
  client: SupabaseClient<Db>
  serviceClient?: SupabaseClient<Db>
}

export type ModelConfig<Db = any> = (
  | { supabase: SupabaseConfig }
  | Clients<Db>
) & {
  primaryKey?: string
  naming?: KeyMapper
}

export interface ModelOptions<Db = any> extends Partial<Clients<Db>> {
  naming?: KeyMapper
  tableName?: string
  primaryKey?: string
}

export type Attributes = Record<string, Attribute>

export interface Attribute<Z extends ZodSchema = any> {
  type: Z
  column: string
  take: (value: any) => TypeOf<Z>
  emit: (value: TypeOf<Z>) => any
}

export type AttributeOptions<Z extends ZodSchema> = Partial<
  Omit<Attribute<Z>, 'type'>
>

export type SchemaOf<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? TypeOf<T[k]['type']> : never
}

export type ShapeOf<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export type ZodSchemaOf<Attrs extends Attributes> = ZodObject<ShapeOf<Attrs>>

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
