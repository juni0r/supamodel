/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from '@supabase/supabase-js'
import type { ZodObject, TypeOf, ZodSchema } from 'zod'

export type Extend<T, E> = Omit<T, keyof E> & E

export interface AnyObject<T = any> {
  [key: anyKey]: T
}

export type anyKey = string | number | symbol
export type mayBe<T> = T | null | undefined

export type ID = string | number

export interface ModelOptions<Db = any> extends Partial<ModelConfig<Db>> {
  tableName?: string
}

export interface ModelConfig<Db = any> {
  client: SupabaseClient<Db>
  primaryKey?: string
  naming?: KeyMapper
}

export interface Attributes {
  [key: string]: Attribute
}

export interface Attribute<Z extends ZodSchema = any> {
  type: Z
  column: string
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
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
