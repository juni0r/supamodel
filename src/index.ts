import type {
  Model,
  ModelClass,
  Schema,
  ShapeOf,
  Transform,
  Values,
} from './types'
import { Implements } from './types'

import type { ZodObject, AnyZodObject, TypeOf } from 'zod'
import { object, ZodSchema } from 'zod'

import pick from 'lodash.pick'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'

export * from './schema'
export * from './types'

@Implements<ModelClass>()
abstract class BaseModel implements Model {
  static $schema: AnyZodObject
  static $transforms: Values<Transform> = {}

  $attributes: Values = {}
  $transformedAttributes: Values = {}

  get $model() {
    return this.constructor as typeof BaseModel
  }

  $takeAttributes(values: Values) {
    const { $transforms } = this.$model
    this.$attributes = mapValues(
      values,
      (value, key) => $transforms[key]?.take(value) ?? value,
    )
  }

  $emitAttributes() {
    const { $transforms } = this.$model
    return mapValues(
      this.$attributes,
      (value, key) => $transforms[key]?.emit(value) ?? value,
    )
  }

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
    get $model() {
      return this.constructor as typeof Model
    }
  }

  Object.entries(schema).forEach(([key, options]) => {
    let property: PropertyDescriptor

    if (options instanceof ZodSchema) {
      options = { type: options }
      property = {}
    } else {
      property = pick(options, 'get', 'set')
    }

    const key_ = snakeCase(key)

    if (options.transform) {
      Model.$transforms[key_] = options.transform
    }

    return Object.defineProperty(Model.prototype, key, {
      get() {
        return this.$get(key_)
      },
      set(value: unknown) {
        this.$set(key_, value)
      },
      ...property,
    })
  })

  return Model as unknown as {
    new (): TypeOf<ZodObject<typeof shape>> & BaseModel
  } & ModelClass<typeof shape>
}

// export const datetime = () => ({
//   type: date(),
//   get() {
//     return new Date(this.$get)
//   }
// })
