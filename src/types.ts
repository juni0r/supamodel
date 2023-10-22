import type { ZodSchema, AnyZodObject } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface ModelClass<S extends AnyZodObject = AnyZodObject> {
  $schema: S
  $transforms: Attributes<Transform>
}

export interface Model {
  $model: ModelClass
  $attributes: Attributes

  $get(key: string): unknown
  $set(key: string, value: unknown): void

  $takeAttributes(values: Attributes): void
  $emitAttributes(): Attributes
}

export interface Attributes<T = unknown> {
  [key: string]: T
}

export interface ModelAttributes {
  [key: string]: Property | ZodSchema
}

export type SchemaFrom<S extends ModelAttributes> = {
  [key in keyof S]: S[key] extends Property
    ? S[key]['type']
    : S[key] extends ZodSchema
    ? S[key]
    : never
}

export interface Transform {
  take: TransformFn
  emit: TransformFn
}

export interface TransformFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (value: any): unknown
}

export interface Property {
  type: ZodSchema
  transform?: Transform

  get?: (this: Model) => unknown
  set?: (this: Model, value: unknown) => void
}
