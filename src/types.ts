import type { ZodSchema, AnyZodObject, TypeOf } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface ModelClass<S extends AnyZodObject = AnyZodObject> {
  $schema: S
  $transforms: Attributes<Transform>
  $keyMap: KeyMap<TypeOf<S>>
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
}

export interface Attributes<T = unknown> {
  [key: string]: T
}

export interface ModelAttributes {
  [key: string]: Property | ZodSchema
}

export type NormalizedAttributes<A extends ModelAttributes> = {
  [key in keyof A]: A[key] extends ZodSchema
    ? Property<A[key]>
    : A[key] extends Property
    ? A[key]
    : never
}

export type SchemaFrom<P extends Properties> = {
  [key in keyof P]: P[key] extends Property ? P[key]['type'] : never
}

export interface Transform {
  take: TransformFn
  emit: TransformFn
}

export interface TransformFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (value: any): unknown
}

export interface Property<T = ZodSchema> {
  type: T
  transform?: Transform

  get?: (this: Model) => unknown
  set?: (this: Model, value: unknown) => void
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
