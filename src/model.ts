import forEach from 'lodash.foreach'

import config from './config'

import { Dict } from './util'
import { identity, zodSchemaOf } from './schema'

import type {
  Attributes,
  Transform,
  SchemaOf,
  Extend,
  ModelOptions,
} from './types'
import BaseModel from './baseModel'

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  _options: Partial<ModelOptions> = {},
) {
  const { base, naming, primaryKey, tableName, client, serviceClient } = {
    ...config(),
    ..._options,
  }

  class model extends base {
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

  defineAttributes(model, attributes)

  type Schema = SchemaOf<Attrs>
  type Model = Schema &
    Extend<
      model,
      {
        $model: ModelClass
        $get<K extends keyof Schema>(key: K): Schema[K]
        $set<K extends keyof Schema>(key: K, value: Schema[K]): void
        $initial<K extends keyof Schema>(key: K): Schema[K]
        $didChange<K extends keyof Schema>(key: K): boolean
      }
    >
  type ModelClass = Extend<
    typeof model,
    {
      new (...args: unknown[]): Model
    }
  >

  return model as ModelClass
}

function defineAttributes(model: typeof BaseModel, attributes: Attributes) {
  const { prototype, transforms, columnNameOf, attributeNameOf } = model

  forEach(attributes, (option, attr) => {
    const column = (option.column ??= model.naming(attr))

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
}

export function withServiceRole(result: () => unknown) {
  return config().base.withServiceRole(result)
}
