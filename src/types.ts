/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'

import { ZodObject } from 'zod'
import type { TypeOf, ZodSchema } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = unknown> {
  [key: string]: T
}

export interface Model<
  Attrs extends Record<string, Attribute>,
  Schema = SchemaFrom<Attrs>,
> {
  $attributes: AnyObject
  $dirty: Partial<Schema>
  $changed: Record<keyof Schema, boolean>
  $get<K extends keyof Schema>(key: K): Schema[K]
  $set<K extends keyof Schema>(key: K, value: Schema[K]): void
  update<C extends this>(this: C): Promise<any>
}

export interface ModelClass<
  Attrs extends Record<string, Attribute>,
  Schema = SchemaFrom<Attrs>,
  Instance = Model<Attrs, Schema>,
> {
  new (...args: any[]): Instance

  client: SupabaseClient
  attributes: Attrs
  schema: ZodObject<ShapeFrom<Attrs>>
  transforms: AnyObject<Transform>
  primaryKey: string
  tableName: string

  find<C extends this>(this: C, id: string | number): Promise<Instance>
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
