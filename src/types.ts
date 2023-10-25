/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TypeOf, ZodSchema } from 'zod'

export function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

export interface AnyObject<T = unknown> {
  [key: string]: T
}

export interface Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  primary: boolean
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export type Infer<T extends Record<string, Attribute>> = {
  [k in keyof T]: T[k] extends Attribute<any> ? TypeOf<T[k]['type']> : never
}

export type SchemaFrom<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export type TypedAttributes<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k] : never
}

export type Changed<T> = {
  [key in keyof T]: boolean
}

export interface Transform {
  take: TransformFn
  emit: TransformFn
}

export interface TransformFn<I = any, O = any> {
  (value: I): O
}
