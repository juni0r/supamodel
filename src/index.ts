import type {
  Model,
  ModelClass,
  ModelAttributes,
  SchemaFrom,
  Transform,
  Attributes,
} from './types'
import { Implements } from './types'

import { object, ZodSchema, type infer as Infer } from 'zod'

import pick from 'lodash.pick'
import forEach from 'lodash.foreach'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'

export * from './schema'
export * from './types'

export function model<S extends ModelAttributes>(attributes: S) {
  const schema = schemaFrom(attributes)

  @Implements<ModelClass<typeof schema>>()
  class model implements Model {
    static $schema = schema
    static $transforms = {} as Attributes<Transform>

    $attributes: Attributes = {}

    get $model() {
      return this.constructor as typeof model
    }

    $get(key: string) {
      return this.$attributes[key]
    }

    $set(key: string, value: unknown) {
      this.$attributes[key] = value
    }

    $takeAttributes(values: Attributes) {
      forEach(this.$model.$transforms, (transform, key) => {
        values[key] = transform.take(values[key])
      })
      this.$attributes = values
    }

    $emitAttributes() {
      const values = { ...this.$attributes }
      forEach(this.$model.$transforms, (transform, key) => {
        values[key] = transform.emit(values[key])
      })
      return values
    }
  }

  Object.entries(attributes).forEach(([key, options]) => {
    let property: PropertyDescriptor

    if (options instanceof ZodSchema) {
      options = { type: options }
      property = {}
    } else {
      property = pick(options, 'get', 'set')
    }

    const key_ = snakeCase(key)

    if (options.transform) {
      model.$transforms[key_] = options.transform
    }

    return Object.defineProperty(model.prototype, key, {
      get() {
        return this.$get(key_)
      },
      set(value: unknown) {
        this.$set(key_, value)
      },
      ...property,
    })
  })

  return model as ModelClass<typeof schema> & {
    new (): model & Infer<typeof schema>
  }
}

function schemaFrom<S extends ModelAttributes>(attributes: S) {
  return object(
    mapValues(attributes, (prop) =>
      prop instanceof ZodSchema ? prop : prop.type,
    ) as SchemaFrom<typeof attributes>,
  )
}
