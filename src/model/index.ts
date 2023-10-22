import { Implements } from './types'
import type { Model, ModelClass, Schema, ShapeOf } from './types'
import {
  object,
  ZodSchema,
  type ZodObject,
  type AnyZodObject,
  type TypeOf,
} from 'zod'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'
import forEach from 'lodash.foreach'
import pick from 'lodash.pick'

export * from 'zod'

@Implements<ModelClass>()
abstract class BaseModel implements Model {
  static $schema: AnyZodObject

  $attributes: Record<string, unknown> = {}

  $get(key: string) {
    return this.$attributes[key]
  }

  $set(key: string, value: unknown) {
    this.$attributes[key] = value
  }
}

export function model<S extends Schema>(schema: S) {
  const shape = mapValues(schema, (prop) =>
    prop instanceof ZodSchema ? prop : prop.type,
  ) as ShapeOf<typeof schema>

  @Implements<ModelClass<typeof shape>>()
  class Model extends BaseModel {
    static $schema = object(shape)
  }

  forEach(schema, (prop, key) => {
    const key_ = snakeCase(key)
    return Object.defineProperty(Model.prototype, key, {
      get() {
        return this.$get(key_)
      },
      set(value: unknown) {
        this.$set(key_, value)
      },
      ...(prop instanceof ZodSchema ? {} : pick(prop, 'get', 'set')),
    })
  })

  return Model as unknown as {
    new (): TypeOf<ZodObject<typeof shape>> & BaseModel
  } & ModelClass<typeof shape>
}
