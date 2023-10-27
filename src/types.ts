/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'
import { ZodObject, type ZodSchema, type TypeOf, type ZodIssue } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = unknown> {
  [key: string]: T
}

export interface ModelOptions<Db = any> extends ModelConfig {
  client?: SupabaseClient<Db>
  tableName?: string
}

export interface ModelConfig {
  naming?: (key: string) => string
}

export interface ModelClass<Attrs extends Record<string, Attribute>> {
  new (...args: any[]): Model<Attrs>

  client: SupabaseClient
  attributes: Attrs
  schema: ZodObject<ShapeFrom<Attrs>, 'strip'>
  transforms: AnyObject<Transform>
  primaryKey: keyof Attrs
  tableName: string

  find(id: string | number): Promise<InstanceType<this>>
}

export interface Model<
  Attrs extends Record<string, Attribute>,
  Schema = SchemaFrom<Attrs>,
> {
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
  $emit<K extends keyof Schema>(...keys: K[]): AnyObject
  $parse(): Schema
  $commit(): void
  validate(): ValidationIssues
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

export type AttributeOptions<Z extends ZodSchema> = Partial<
  Omit<Attribute<Z>, 'type'>
>

export type Attributes<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k] : never
}

export type SchemaFrom<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? TypeOf<T[k]['type']> : never
}

export type ShapeFrom<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export interface Transform {
  take: (v: any) => any
  emit: (v: any) => any
}

export interface ValidationIssues extends Array<ZodIssue> {
  any: boolean
  none: boolean
}

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
