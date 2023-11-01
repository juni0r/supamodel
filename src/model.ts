/* eslint-disable @typescript-eslint/no-explicit-any */
import BaseModel from './baseModel'
import { createClient, SupabaseClient } from '.'
import { Dict, New, snakeCase } from './util'
import { identity, zodSchemaOf } from './schema'
import forEach from 'lodash.foreach'

const { assign, defineProperty } = Object

import type {
  ModelConfig,
  ModelConfigOptions,
  Attributes,
  Transform,
  SchemaOf,
  Extend,
} from './types'

export const config = assign(New<ModelConfig>(), {
  base: BaseModel,
  naming: snakeCase,
  primaryKey: 'id' as const,
})

export function defineModelConfig<DB = any>({
  client,
  serviceClient,
  ...options
}: ModelConfigOptions<DB>) {
  if (!(client instanceof SupabaseClient)) {
    const { url, anonKey, serviceKey } = client

    client = createClient<DB>(url, anonKey)

    if (serviceKey) {
      serviceClient = createClient<DB>(url, serviceKey)
    }
  }

  assign(config, {
    client,
    serviceClient,
    ...options,
  })
}

export function defineModel<DB = any, Attrs extends Attributes = Attributes>(
  attributes: Attrs,
  options: Partial<ModelConfig<DB>> = {},
) {
  type Schema = SchemaOf<Attrs>

  const { naming, primaryKey, client, serviceClient, tableName } = {
    ...config,
    ...options,
  }

  class model extends config.base<DB> {
    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = Dict<Transform>()
    static naming = naming
    static primaryKey = primaryKey

    static columnNameOf = Dict<string>()
    static attributeNameOf = Dict<string>()
  }
  if (client) model.client = client as SupabaseClient
  if (serviceClient) model.serviceClient = serviceClient as SupabaseClient
  if (tableName) model.tableName = tableName

  const { prototype, transforms, columnNameOf, attributeNameOf } = model

  forEach(attributes, (option, attr) => {
    const column = (option.column ??= model.naming(attr))

    columnNameOf[attr] = column
    attributeNameOf[column] = attr

    const { take = identity, emit = identity } = option
    transforms[column] = { take, emit }

    defineProperty(prototype, attr, {
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

export async function withServiceRole(execute: () => unknown) {
  return await config.base.withServiceRole(execute)
}
