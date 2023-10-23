import type {
  Model,
  ModelClass,
  ModelAttributes,
  SchemaFrom,
  Transform,
  Attributes,
  Changed,
  KeyMap,
  NormalizedAttributes,
  Properties,
} from './types'
import { Implements } from './types'

import { object, ZodSchema, type infer as Infer } from 'zod'

import pick from 'lodash.pick'
import forEach from 'lodash.foreach'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

export * from './schema'
export * from './types'

const { hasOwnProperty } = Object.prototype

export function model<T extends ModelAttributes>(_attributes: T) {
  const attributes = normalize(_attributes)
  const schema = schemaFrom(attributes)

  type Schema = Infer<typeof schema>

  @Implements<ModelClass<typeof schema>>()
  class model implements Model {
    static $schema = schema
    static $transforms = {} as Attributes<Transform>
    static $keyMap = {} as KeyMap<Schema>

    $attributes: Attributes = {}
    $dirty = {} as Partial<Schema>
    $changed = new Proxy(this, changedHandler) as Changed<Schema>

    get $model() {
      return this.constructor as typeof model
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    $get(key: string) {
      return this.$attributes[model.$keyMap[key]]
    }

    $set(key: keyof Schema, value: unknown) {
      const _key = model.$keyMap[key]
      const current = this.$attributes[_key] as Schema[typeof key]

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else if (!isEqual(value, current)) {
        this.$dirty[key] = current
      }
      this.$attributes[_key] = value
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

  Object.keys(schema).forEach((key) => {
    const options = attributes[key]
    const property = pick(options, 'get', 'set')

    model.$keyMap[key as keyof Schema] = snakeCase(key)

    if (options.transform) {
      model.$transforms[model.$keyMap[key]] = options.transform
    }

    return Object.defineProperty(model.prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
      ...property,
    })
  })

  return model as ModelClass<typeof schema> & {
    new (): model & Schema
  }
}

function normalize<T extends ModelAttributes>(attrs: T) {
  return mapValues(attrs, (prop) =>
    prop instanceof ZodSchema ? { type: prop } : prop,
  ) as NormalizedAttributes<T>
}

function schemaFrom<T extends Properties>(attributes: T) {
  return object(mapValues(attributes, ({ type }) => type) as SchemaFrom<T>)
}

const changedHandler: ProxyHandler<Model> = {
  get(target, key) {
    return hasOwnProperty.call(target.$dirty, key)
  },
}
