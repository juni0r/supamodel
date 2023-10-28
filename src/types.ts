/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodObject, ZodSchema, TypeOf } from 'zod'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types'

import type { FnMap } from './fnMap'
import type Issues from './issues'
export type { Issues }

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = any> {
  [key: string | number | symbol]: T
}

export interface ModelOptions<Db = any> extends Partial<ModelConfig<Db>> {
  tableName?: string
}

export interface ModelConfig<Db = any> {
  client: SupabaseClient<Db>
  primaryKey?: string
  naming?: KeyMapper
}

export interface ModelClass<Attrs extends Attributes> {
  new (...args: any[]): Model<Attrs>

  client: SupabaseClient
  attributes: Attrs
  transforms: AnyObject<Transform>
  schema: ZodObject<ZodShapeFrom<Attrs>>
  primaryKey: keyof Attrs
  tableName: string
  naming: KeyMapper
  attributeToColumn: FnMap<keyof Attrs, string>
  columnToAttribute: FnMap<string, keyof Attrs>
  find(id: string | number): Promise<InstanceType<this>>
  findAll(
    scoped?: (scope: FilterBuilder) => FilterBuilder,
  ): Promise<InstanceType<this>[]>
  insert(record: AnyObject): any
  update(id: string | number, record: AnyObject): any
}

export interface Model<Attrs extends Attributes, Schema = SchemaFrom<Attrs>> {
  $model: ModelClass<Attrs>

  $id: string | number
  $attributes: AnyObject
  $dirty: Partial<Schema>
  $changed: Changed<Schema>

  $isDirty: boolean
  $isPersisted: boolean
  $isNewRecord: boolean

  $get<K extends keyof Schema>(key: K): Schema[K]
  $set<K extends keyof Schema>(key: K, value: Schema[K]): void
  $take(values: AnyObject): void
  $emit(options?: { onlyDirty?: boolean }): AnyObject
  $parse(): Schema
  $commit(): void
  $reset(): void
  validate(): Issues
  save<C extends this>(this: C): Promise<Issues>
  toJSON(): ToJSON
}

export interface Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  primary: boolean
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export type KeyMap<
  From extends string | number | symbol = string,
  To = string,
> = Record<From, To>

export interface KeyMapper {
  (key: string | number | symbol): string
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

export type SchemaFrom<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? TypeOf<T[k]['type']> : never
}

export type ZodShapeFrom<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export type Changed<T> = {
  [k in keyof T]: boolean
}

export interface Transform {
  take: (v: any) => any
  emit: (v: any) => any
}

export interface FilterBuilder<
  Schema extends GenericSchema = any,
  Row extends Record<string, unknown> = any,
  Result = any[],
  Relationships = unknown,
> extends PostgrestFilterBuilder<Schema, Row, Result, Relationships> {}

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
