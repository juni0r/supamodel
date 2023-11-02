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

export function defineModel<DB = any, Attrs extends Attributes = Attributes>(
  attributes: Attrs,
  options: Partial<ModelConfig<DB>> & { tableName?: string } = {},
) {
  const modelConfig = config<DB>()

  const { tableName, client, serviceClient, naming, primaryKey } = {
    ...modelConfig,
    ...options,
  }

  class model extends modelConfig.base {
    declare static client: SupabaseClient<DB>
    declare static serviceClient: SupabaseClient<DB>

    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = Dict<Transform>()
    static naming = naming
    static primaryKey = primaryKey

    static columnNameOf = Dict<string>()
    static attributeNameOf = Dict<string>()
  }

  if (tableName) model.tableName = tableName
  if (client) model.client = client as SupabaseClient<DB>
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
            // $find<T extends InstanceType<typeof model>>(
            //   this: T,
            //   values: AnyObject,
            // ): T
            // $take<T extends InstanceType<typeof model>>(
            //   this: T,
            //   values: AnyObject,
            // ): T
            $initial<K extends keyof Schema>(key: K): Schema[K]
            $didChange<K extends keyof Schema>(key: K): boolean
          }
        >
    }
  >
}

export function withServiceRole<DB>(result: () => unknown) {
  return config<DB>().base.withServiceRole<DB>(result)
}
