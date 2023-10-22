import type { ZodSchema, ZodObject, ZodRawShape } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface Property {
  type: ZodSchema
  get?: (this: Model) => unknown
  set?: (this: Model, value: unknown) => void
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
}

export interface Model {
  $attributes: Record<string, unknown>
  $get(key: string): unknown
  $set(key: string, value: unknown): void
}
