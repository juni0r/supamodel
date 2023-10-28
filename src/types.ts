/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodObject, ZodSchema, TypeOf } from 'zod'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js'
import type { GenericSchema } from '@supabase/supabase-js/dist/module/lib/types'

import type Issues from './issues'
export type { Issues }

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = unknown> {
  [key: string]: T
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
  schema: ZodObject<ZodShapeFrom<Attrs>>
  transforms: AnyObject<Transform>
  primaryKey: keyof Attrs
  tableName: string
  naming: KeyMapper
  attributeToColumn: KeyMap
  columnToAttribute: KeyMap
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
  $isDirty: boolean
  $changed: Record<keyof Schema, boolean>
  $isPersisted: boolean

  $get<K extends keyof Schema>(key: K): Schema[K]
  $set<K extends keyof Schema>(key: K, value: Schema[K]): void
  $take(values: AnyObject): void
  $emit(options?: EmitOptions): AnyObject
  $parse(): Schema
  $commit(): void
  $reset(): void
  validate(): Issues
  save<C extends this>(this: C): Promise<any>
  toJSON(): ToJSON
}

export interface Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  primary: boolean
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export interface KeyMap {
  [key: string]: string
}

export interface KeyMapper {
  (key: any): string
}

export interface EmitOptions {
  onlyDirty?: boolean
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
