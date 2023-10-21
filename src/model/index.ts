import {
  object,
  ZodSchema,
  type ZodObject,
  type ZodRawShape,
  type AnyZodObject,
  type TypeOf,
} from 'zod'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'
import forEach from 'lodash.foreach'
import pick from 'lodash.pick'

function Implements<T>() {
  return <U extends T>(constructor: U) => {
    constructor
  }
}

interface ModelClass<S extends ZodRawShape> {
  $schema: ZodObject<S>
}

abstract class Model {
  static $schema: AnyZodObject

  $attributes: Record<string, unknown> = {}

  $get(key: string) {
    return this.$attributes[key]
  }

  $set(key: string, value: unknown) {
    this.$attributes[key] = value
  }
}

interface Property {
  type: ZodSchema
  get?: (this: Model) => unknown
  set?: (this: Model, value: unknown) => void
}

interface Schema {
  [key: string]: Property | ZodSchema
}

type ShapeOf<S extends Schema> = {
  [Prop in keyof S]: S[Prop] extends Property
    ? S[Prop]['type']
    : S[Prop] extends ZodSchema
    ? S[Prop]
    : never
}

export function model<S extends Schema>(schema: S) {
  const shape = mapValues(schema, (prop) =>
    prop instanceof ZodSchema ? prop : prop.type,
  ) as ShapeOf<typeof schema>

  @Implements<ModelClass<typeof shape>>()
  class model extends Model {
    static $schema = object(shape)
  }

  forEach(schema, (prop, key) => {
    const key_ = snakeCase(key)
    return Object.defineProperty(model.prototype, key, {
      get() {
        return this.$get(key_)
      },
      set(value: unknown) {
        this.$set(key_, value)
      },
      ...(prop instanceof ZodSchema ? {} : pick(prop, 'get', 'set')),
    })
  })

  return model as unknown as {
    new (): TypeOf<ZodObject<typeof shape>> & Model
  } & ModelClass<typeof shape>
}
