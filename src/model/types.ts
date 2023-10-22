import type { ZodSchema, ZodObject, ZodRawShape } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

// export interface TransformFn<In = unknown, Out = unknown> {
//   (value: In): Out
// }
export interface TransformFn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (value: any): unknown
}

export interface Transform {
  consume: TransformFn
  emit: TransformFn
}

export interface Property {
  type: ZodSchema
  get?: (this: Model) => unknown
  set?: (this: Model, value: unknown) => void
  transform?: Transform
}

export interface Schema {
  [key: string]: Property | ZodSchema
}

export type ShapeOf<S extends Schema> = {
  [Prop in keyof S]: S[Prop] extends Property
    ? S[Prop]['type']
    : S[Prop] extends ZodSchema
    ? S[Prop]
    : never
}

export interface ModelClass<S extends ZodRawShape = ZodRawShape> {
  $schema: ZodObject<S>
  $transforms: Record<string, Transform>
}

export interface Model {
  $attributes: Record<string, unknown>
  $transformedAttributes: Record<string, unknown>
  $model: ModelClass
  $get(key: string): unknown
  $set(key: string, value: unknown): void
}
