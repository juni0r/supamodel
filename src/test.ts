/* eslint-disable @typescript-eslint/no-explicit-any */
import { Simplify } from 'type-fest'
import { number, string, type ZodObject, type TypeOf, ZodSchema } from 'zod'
import { AnyObject, KeyMapper, SchemaOf, Transform, anyKey } from './types'
import {
  New,
  hasOwnKey,
  keysOf,
  zodSchemaOf,
  defineProperty,
  snakeCase,
} from './util'
import forEach from 'lodash.foreach'

export interface Attributes {
  [key: string]: Attribute
}

export interface Attribute<Z extends ZodSchema = any> {
  type: Z
  column: string
  take?: (value: any) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => any
}

export type ShapeOf<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k]['type'] : never
}

export type ZodSchemaOf<Attrs extends Attributes> = ZodObject<ShapeOf<Attrs>>

// export interface ModelClass<Attrs extends Attributes> {
//   attributes: Attrs
//   schema: ZodSchemaOf<Attrs>
// }

function attr<Z extends ZodSchema>(options: Z | Attribute<Z>) {
  return (
    options instanceof ZodSchema ? { type: options } : options
  ) as Attribute<Z>
}

abstract class BaseModel {
  static attributes: Attributes
  static schema: ZodSchemaOf<Attributes>
  static transforms: Record<string, Transform>
  static naming: KeyMapper

  static attributeToColumn: Record<anyKey, string>
  static columnToAttribute: Record<string, anyKey>

  $attributes = New()

  get $model() {
    return this.constructor as typeof BaseModel
  }

  $get(key: anyKey) {
    return this.$attributes[this.$model.attributeToColumn[key]]
  }

  $set(key: anyKey, value: unknown) {
    this.$attributes[this.$model.attributeToColumn[key]] = value
  }

  $take(values: AnyObject) {
    const { transforms } = this.$model

    forEach(values, (value, column) => {
      value = hasOwnKey(transforms, column)
        ? transforms[column].take(value)
        : value

      this.$attributes[column] = value
    })
    return this
  }
}

function defineModel<Attrs extends Attributes>(attributes: Attrs) {
  type Schema = SchemaOf<Attrs>

  class model extends BaseModel {
    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = New<Record<string, Transform>>()
    static naming = snakeCase

    static attributeToColumn = New<Record<keyof Attrs, string>>()
    static columnToAttribute = New<Record<string, keyof Attrs>>()
  }

  const { transforms, attributeToColumn, columnToAttribute } = model

  keysOf(attributes).forEach((attr) => {
    const option = attributes[attr]
    const column = (option.column ||= model.naming(attr))

    attributeToColumn[attr] = column
    columnToAttribute[column] = attr

    if (option.take || option.emit) {
      transforms[column] = {
        take: option.take ?? ((v: unknown) => v),
        emit: option.emit ?? ((v: unknown) => v),
      }
    }

    defineProperty(model.prototype, attr, {
      get() {
        return this.$get(attr)
      },
      set(value: unknown) {
        this.$set(attr, value)
      },
    })
  })

  return model as Omit<typeof model, 'new'> & {
    new (...args: any): Simplify<
      Schema &
        Omit<model, '$get' | '$set'> & {
          $get<K extends keyof Schema>(key: K): Schema[K]
          $set<K extends keyof Schema>(key: K, value: Schema[K]): void
        }
    >
  }
}

const Record = defineModel({
  firstName: { type: string(), column: 'first_name' },
  lastName: attr(string()),
  score: { type: number(), column: 'score' },
})

console.log(Record.schema.shape.score._def.typeName)

const rec = new Record()
rec.$take({ first_name: 'Henry', last_name: 'Smoketoomuch' })
console.log(rec)
console.log(rec.lastName)
rec.$set('score', 23)
console.log(rec.$get('score'))
console.log(rec.score)
