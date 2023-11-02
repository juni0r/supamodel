import { SupabaseClient } from '@supabase/supabase-js'
import forEach from 'lodash.foreach'

import config from './config'

import { Dict } from './util'
import { identity, zodSchemaOf } from './schema'

import type {
  Attributes,
  Transform,
  SchemaOf,
  Extend,
  ModelConfig,
} from './types'

export function defineModel<Attrs extends Attributes = Attributes, DB = any>(
  attributes: Attrs,
  options: Partial<ModelConfig<DB>> = {},
) {
  const { base, tableName, client, serviceClient, naming, primaryKey } = {
    ...config(),
    ...options,
  } as ModelConfig<DB>

  class model extends base {
    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = Dict<Transform>()
    static naming = naming
    static primaryKey = primaryKey

    static columnNameOf = Dict<string>()
    static attributeNameOf = Dict<string>()
  }

  if (tableName) model.tableName = tableName
  if (client) model.client = client as SupabaseClient
  if (serviceClient) model.serviceClient = serviceClient

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

  type Schema = SchemaOf<Attrs>

  return model as Extend<
    typeof model,
    {
      new (...args: unknown[]): Schema &
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

export function withServiceRole(result: () => unknown) {
  return config().base.withServiceRole(result)
}
