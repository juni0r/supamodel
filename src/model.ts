import { SupabaseClient } from '@supabase/supabase-js'

import BaseModel from './baseModel'
import { zodSchemaOf } from './schema'
import { Dict, identity } from './util'
import config from './config'

import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'

import type {
  Attributes,
  Transform,
  SchemaOf,
  Extend,
  ModelOptions,
} from './types'

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  _options: Partial<ModelOptions> = {},
) {
  const { base, naming, primaryKey, tableName, client } = {
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

  forEach(
    mapValues(attributes, (option, attr) =>
      option.column ? option : { ...option, column: model.naming(attr) },
    ),

    ({ column, take = identity, emit = identity }, attr) => {
      attributeNameOf[column] = attr
      columnNameOf[attr] = column

      transforms[column] = { take, emit }

      Object.defineProperty(prototype, attr, {
        get() {
          return this.$get(attr)
        },
        set(value: unknown) {
          this.$set(attr, value)
        },
      })
    },
  )
}

export function withClient<DB>(client: SupabaseClient<DB>, execute: () => any) {
  return config().base.withClient(client, execute)
}
