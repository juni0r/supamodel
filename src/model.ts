import { SupabaseClient } from '@supabase/supabase-js'

import forEach from 'lodash.foreach'

import { baseModel } from './config'
import { BaseModel } from './baseModel'
import { Transform } from './transform'
import { zodSchemaOf } from './schema'
import { Dict } from './util'

import type { Attributes, SchemaOf, Extend, ModelOptions } from './types'

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  { naming, primaryKey, tableName, client }: Partial<ModelOptions> = {},
) {
  class model extends baseModel {
    static attributes = attributes
    static transforms = Dict<Transform>()
    static schema = zodSchemaOf(attributes)
  }

  if (client) model.client = client
  if (naming) model.naming = naming
  if (tableName) model.tableName = tableName
  if (primaryKey) model.primaryKey = primaryKey

  forEach(attributes, ({ column, take, emit }, key) => {
    model.transforms[key] = new Transform(
      column || model.naming(key),
      take,
      emit,
    )

    Object.defineProperty(model.prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
    })
  })

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

export function withClient<DB>(client: SupabaseClient<DB>, execute: () => any) {
  return BaseModel.withClient(client, execute)
}
