import { SupabaseClient } from '@supabase/supabase-js'

import config from './config'

import { identity, zodSchemaOf } from './schema'
import { Dict } from './util'

import forEach from 'lodash.foreach'

import type {
  ModelConfig,
  Attributes,
  Transform,
  SchemaOf,
  Extend,
} from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineModel<DB = any, Attrs extends Attributes = Attributes>(
  attributes: Attrs,
  options: Partial<ModelConfig<DB>> = {},
) {
  type Schema = SchemaOf<Attrs>

  const { naming, primaryKey, client, serviceClient, tableName } = {
    ...config(),
    ...options,
  }

  class model extends config<DB>().base {
    static client: SupabaseClient<DB>
    static serviceClient: SupabaseClient<DB>

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

export async function withServiceRole<DB>(execute: () => unknown) {
  return await config<DB>().base.withServiceRole<DB>(execute)
}
