/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseModel } from './baseModel'
import { Dict, New, identity, snakeCase, zodSchemaOf } from './util'
import type {
  ModelOptions,
  ModelConfig,
  Attributes,
  Transform,
  SchemaOf,
  Extend,
} from './types'
import forEach from 'lodash.foreach'

const modelOptions = Object.assign(New<ModelConfig>(), {
  naming: snakeCase,
  primaryKey: 'id' as const,
})

export function defineModelConfig(options: ModelConfig) {
  Object.assign(modelOptions, options)
}

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  options: ModelOptions = {},
) {
  const { naming, primaryKey, tableName, client, serviceClient } = {
    ...modelOptions,
    ...options,
  }

  class model extends BaseModel {
    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = Dict<Transform>()
    static naming = naming
    static primaryKey = primaryKey

    static columnNameOf = Dict<string>()
    static attributeNameOf = Dict<string>()
  }

  if (client) model.client = client
  if (serviceClient) model.serviceClient = serviceClient
  if (tableName) model.tableName = tableName

  const { prototype, transforms, columnNameOf, attributeNameOf } = model

  forEach(attributes, (option, attr) => {
    const column = (option.column ||= model.naming(attr))

    columnNameOf[attr] = column
    attributeNameOf[column] = attr

    const { take = identity, emit = identity } = option
    transforms[column] = { take, emit }

    Object.defineProperty(prototype, attr, {
      get() {
        return this.$get(attr)
      },
      set(value: unknown) {
        this.$set(attr, value)
      },
    })
  })

  type Schema = SchemaOf<Attrs>

  return model as Extend<
    typeof model,
    {
      new (...args: any): Schema &
        Extend<
          model,
          {
            $model: typeof model
            $get<K extends keyof Schema>(key: K): Schema[K]
            $set<K extends keyof Schema>(key: K, value: Schema[K]): void
            $initial<K extends keyof Schema>(key: K): Schema[K]
            $didChange<K extends keyof Schema>(key: K): boolean
          }
        >
    }
  >
}
