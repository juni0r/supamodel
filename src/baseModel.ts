/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from '@supabase/supabase-js'
import forEach from 'lodash.foreach'
import { New, hasOwnKey } from './util'
import Issues from './issues'
import type {
  Attributes,
  AnyObject,
  anyKey,
  KeyMapper,
  Transform,
  ZodSchemaOf,
  ID,
} from './baseTypes'

// function attr<Z extends ZodSchema>(options: Z | Attribute<Z>) {
//   return (
//     options instanceof ZodSchema ? { type: options } : options
//   ) as Attribute<Z>
// }

export abstract class BaseModel {
  static client: SupabaseClient
  static attributes: Attributes
  static schema: ZodSchemaOf<Attributes>
  static transforms: Record<string, Transform>
  static naming: KeyMapper
  static tableName: string
  static primaryKey: string
  static attributeToColumn: Record<anyKey, string>
  static columnToAttribute: Record<string, anyKey>

  $attributes = New()

  get $model() {
    return this.constructor as typeof BaseModel
  }

  get $id() {
    return this[this.$model.primaryKey as keyof this] as ID
  }

  $get(key: anyKey) {
    return this.$attributes[this.$model.attributeToColumn[key]]
  }

  $set(key: anyKey, value: unknown) {
    this.$attributes[this.$model.attributeToColumn[key]] = value
  }

  $take<T extends BaseModel>(this: T, values: AnyObject) {
    const { transforms } = this.$model

    forEach(values, (value, column) => {
      value = hasOwnKey(transforms, column)
        ? transforms[column].take(value)
        : value

      this.$attributes[column] = value
    })

    return this
  }

  $parse() {
    return this.$model.schema.parse(this)
  }

  validate() {
    try {
      Object.assign(this, this.$parse())
    } catch (error) {
      return Issues.handle(error)
    }
    return Issues.none()
  }
}
