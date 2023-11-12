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

import type {
  ZodObject,
  TypeOf,
  ZodSchema,
  deoptional,
  ZodNullable,
  ZodDefault,
  ZodTypeAny,
} from 'zod'

import type { Relation } from './relations/relation'
import type { SupamodelError } from './errors'
import { mixin } from 'mixwith.ts'

import type { ModelClass } from './model'
export type { ModelClass }

// eslint-disable-next-line @typescript-eslint/ban-types
export type Simplify<T> = { [k in keyof T]: T[k] } & {}
export type Extend<T, E> = E & Omit<T, keyof E>

export type anyKey = string | number | symbol
export interface AnyObject<T = any> {
  [key: anyKey]: T
}

export type maybeArray<T> = T | T[]
export type mayBe<Type> = Type | null | undefined

export type ID = string | number

export interface ModelConfigOptions<Ext extends ModelClass = ModelClass> {
  client?:
    | SupabaseClient
    | {
        url: string
        key: string
        serviceKey?: string
      }
  primaryKey?: string
  naming?: KeyMapper
  extend?: mixin<ModelClass, Ext>
}

export interface ModelConfig<Ext extends ModelClass = ModelClass> {
  client: SupabaseClient
  primaryKey: string
  naming: KeyMapper
  extend?: mixin<ModelClass, Ext>
}

export interface ModelOptions<A extends Attributes = Attributes> {
  naming?: KeyMapper
  tableName?: string
  primaryKey?: keyof A
}

export type Attributes = Record<string, Attribute>

export type DatabaseFrom<T> = Exclude<
  T extends Attributes ? T['_database_'] : never,
  undefined
>

export interface Attribute<Z extends ZodSchema = any> {
  type: Z
  column: string
  take: (value: any) => TypeOf<Z>
  emit: (value: TypeOf<Z>) => any
}

export type AttributeOptions<Z extends ZodSchema = any> = Partial<
  Omit<Attribute<Z>, 'type'>
>

export type TransformsOf<A extends Attributes> = Simplify<{
  [k in keyof A]: A[k] extends Attribute ? Simplify<Omit<A[k], 'type'>> : never
}>

export type ZodObjectOf<A extends Attributes> = ZodObject<ShapeOf<A>>

export type SchemaOf<A extends Attributes> = Simplify<{
  [k in keyof A]: A[k] extends Attribute ? TypeOf<A[k]['type']> : never
}>

export type ShapeOf<A extends Attributes> = Simplify<{
  [k in keyof A]: A[k] extends Attribute ? A[k]['type'] : never
}>

export type ScopeOf<A extends Attributes> = Simplify<Partial<SchemaOf<A>>>

export type DefaultsOf<
  A extends Attributes,
  S extends ShapeOf<A> = ShapeOf<A>,
> = Simplify<{
  [k in keyof S as S[k] extends ZodNullable<any> | ZodDefault<any>
    ? k
    : never]: DefaultType<S[k]>
}>

export type DefaultType<
  T extends ZodTypeAny,
  D = deoptional<T>,
> = D extends ZodNullable<infer I>
  ? () => TypeOf<I> | null
  : D extends ZodDefault<infer I>
  ? () => TypeOf<I>
  : never

export interface ClassProxy<T extends ModelClass = ModelClass> {
  (): T
}
export type ResolveClass<Proxy extends ClassProxy> = Proxy extends ClassProxy<
  infer T
>
  ? T
  : never

export type Relations = Record<string, Relation>
export type RelationOptions = Record<string, RelationOption>

export interface RelationOption<
  R extends typeof Relation = any,
  T extends ModelClass = any,
> {
  type: R
  target: ClassProxy<T>
  foreignKey?: keyof T['schema']
}

export interface KeyMapper {
  (key: string): string
}

export interface Transform<In = any, Out = any> {
  column: string
  take: (val: Out) => In
  emit: (val: In) => Out
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

export type Result<Data, Error = SupamodelError> =
  | { data: Data; error: null }
  | { error: Error; data: null }

export type AsyncResult<Data, Error = SupamodelError> = Promise<
  Result<Data, Error>
>
