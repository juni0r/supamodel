/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TypeOf, ZodObject, ZodSchema } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = unknown> {
  [key: string]: T
}

export interface Model<A extends Attributes> {
  $attributes: A
  $schema: ZodObject<ShapeFrom<A>>
  $transforms: AnyObject<Transform>
}

export interface Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  primary: boolean
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export type Attributes<T = Record<string, Attribute>> = {
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
