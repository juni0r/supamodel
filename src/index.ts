import type {
  Model,
  ModelClass,
  ModelOptions,
  SchemaFrom,
  Transform,
  Attributes,
  Changed,
  NormalizedOptions,
} from './types'
import { Implements } from './types'

import { object, ZodSchema, type infer as Infer, ZodIssue, ZodError } from 'zod'

import pick from 'lodash.pick'
import forEach from 'lodash.foreach'
import snakeCase from 'lodash.snakecase'
import mapValues from 'lodash.mapvalues'
import isEmpty from 'lodash.isempty'
import isEqual from 'fast-deep-equal'

export * from './schema'
export * from './types'

const { hasOwnProperty } = Object.prototype

/**
 * Description placeholder
 * @date 23/10/2023 - 22:43:09
 *
 * @export
 * @param {T} _options The options for the model
 * @returns {ModelClass} This function generates a model class based on the
 * provided options. The generated class implements the Model interface and has
 * methods for getting and setting attributes, tracking attribute changes,
 * taking and emitting attributes, and transforming attribute values.
 */
export function model<T extends ModelOptions>(_options: T) {
  const options = normalize(_options)

  const schema = object(
    mapValues(options, 'type') as SchemaFrom<typeof options>,
  )
  type Schema = Infer<typeof schema>

  @Implements<ModelClass<typeof schema>>()
  class model implements Model {
    static $schema = schema
    static $transforms: Attributes<Transform> = {}
    static $keyMap: Attributes<string> = {}

    $attributes: Attributes = {}
    $dirty: Partial<Schema> = {}

    $changed = new Proxy(this.$dirty, {
      get: (target, key) => hasOwnProperty.call(target, key),
    }) as Changed<Schema>

    get $model() {
      return model
    }

    get $isDirty() {
      return !isEmpty(this.$dirty)
    }

    /**
     * Get attribute value for the given key
     *
     * @param {K} key The key of the attribute to get
     */
    $get<K extends keyof Schema>(key: K) {
      return this.$attributes[model.$keyMap[key as string]] as Schema[K]
    }

    /**
     * Set attribute value for the given key
     *
     * @param {K} key The key of the attribute to set
     * @param {Schema[K]} value The value to set for the attribute
     */
    $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      const _key = model.$keyMap[key as string]

      if (key in this.$dirty) {
        if (isEqual(value, this.$dirty[key])) {
          delete this.$dirty[key]
        }
      } else {
        const current = this.$attributes[_key]
        if (!isEqual(value, current)) {
          this.$dirty[key] = current as typeof value
        }
      }
      this.$attributes[_key] = value
    }

    $takeAttributes(values: Attributes) {
      forEach(model.$transforms, (transform, key) => {
        values[key] = transform.take(values[key])
      })
      this.$attributes = values
    }

    $emitAttributes() {
      const values = { ...this.$attributes }
      forEach(model.$transforms, (transform, key) => {
        values[key] = transform.emit(values[key])
      })
      return values
    }

    async validate() {
      try {
        Object.assign(this, await model.$schema.parseAsync(this))
      } catch (error) {
        if (error instanceof ZodError) {
          return Issues.from(error.issues)
        }
        throw error
      }
      return new Issues()
    }
  }

  const { $keyMap, $transforms, prototype } = model

  forEach(options, (option, key) => {
    $keyMap[key] = snakeCase(key)

    if (option.transform) {
      $transforms[$keyMap[key]] = option.transform
    }

    return Object.defineProperty(prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
      ...pick(option, 'get', 'set'),
    })
  })

  return model as ModelClass<typeof schema> & {
    new (): model & Schema
  }
}

function normalize<T extends ModelOptions>(attrs: T) {
  return mapValues(attrs, (prop) =>
    prop instanceof ZodSchema ? { type: prop } : prop,
  ) as NormalizedOptions<T>
}

export class Issues extends Array<ZodIssue> {
  static from(issues: ZodIssue[]) {
    return Object.setPrototypeOf(issues, this.prototype) as Issues
  }
  get any() {
    return this.length > 0
  }
  get none() {
    return this.length === 0
  }
}
