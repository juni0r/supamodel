/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ZodSchema, AnyZodObject, ZodIssue } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface ModelClass<S extends AnyZodObject = AnyZodObject> {
  $schema: S
  $keyMap: Attributes<string>
  $transforms: Attributes<Transform>
}

export interface Model {
  $model: ModelClass
  $attributes: Attributes
  $dirty: Attributes
  $changed: Attributes<boolean>

  readonly $isDirty: boolean

  $get(key: string): unknown
  $set(key: string, value: unknown): void

  $takeAttributes(values: Attributes): void
  $emitAttributes(): Attributes

  validate(): Promise<Issues>
}

export interface Issues extends Array<ZodIssue> {
  any: boolean
  none: boolean
}

export interface Attributes<T = unknown> {
  [key: string]: T
}

export interface ModelOptions {
  [key: string]: Property | ZodSchema
}

export type NormalizedOptions<A extends ModelOptions> = {
  [key in keyof A]: A[key] extends ZodSchema<infer T>
    ? Property<T>
    : A[key] extends Property
    ? A[key]
    : never
}

export type SchemaFrom<P extends Properties> = {
  [key in keyof P]: P[key] extends Property ? P[key]['type'] : never
}

export interface Transform<External = any, Internal = any> {
  take: TransformFn<External, Internal>
  emit: TransformFn<Internal, External>
}

export interface TransformFn<External = any, Internal = any> {
  (value: External): Internal
}

export interface Property<
  T = any,
  U = any,
  S extends ZodSchema<T> = ZodSchema<T>,
> {
  type: S
  transform?: Transform<T, U>

  get?: (this: Model) => T
  set?: (this: Model, value: T) => void
}

export interface Properties {
  [key: string]: Property
}

export type Changed<T = AnyZodObject> = {
  [key in keyof T]: boolean
}

export type KeyMap<T = AnyZodObject> = {
  [key in keyof T]: string
}
