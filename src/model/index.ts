import { Implements } from './types'
import type { Model, ModelClass, Schema, ShapeOf, Transform } from './types'
import {
  object,
  ZodSchema,
  type ZodObject,
  type AnyZodObject,
  type TypeOf,
} from 'zod'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'
import pick from 'lodash.pick'

export * from 'zod'

// const identity: Transform = (value: unknown) => value

@Implements<ModelClass>()
abstract class BaseModel implements Model {
  static $schema: AnyZodObject
  static $transforms: Record<string, Transform> = {}

  $attributes: Record<string, unknown> = {}
  $transformedAttributes: Record<string, unknown> = {}

  get $model() {
    return this.constructor as typeof BaseModel
  }

  $get(key: string) {
    const transform = this.$model.$transforms[key]
    if (!transform) {
      return this.$attributes[key]
    }
    if (key in this.$transformedAttributes) {
      return this.$transformedAttributes[key]
    }
    return (this.$transformedAttributes[key] = transform.consume(
      this.$attributes[key],
    ))
  }

  $set(key: string, value: unknown) {
    const transform = this.$model.$transforms[key]
    if (!transform) {
      this.$attributes[key] = value
      return
    }
    delete this.$transformedAttributes[key]
    this.$attributes[key] = transform.emit(value)
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
