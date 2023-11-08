import { SupabaseClient } from '@supabase/supabase-js'

import merge from 'lodash.merge'

import { baseModel } from './config'
import { BaseModel } from './baseModel'
import { defaultsOf, zodSchemaOf } from './schema'
import { Dict, TrackedDirty, identity } from './util'

import type {
  ModelOptions,
  Attributes,
  Transform,
  SchemaOf,
  Extend,
} from './types'

const { defineProperty } = Object

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  options: Partial<ModelOptions> = {},
) {
  class model extends baseModel {
    static attributes = attributes
    static transforms = Dict<Transform>()
    static schema = zodSchemaOf(attributes)
    static defaults = defaultsOf(attributes)
    static scope = Dict()

    // $attributes = TrackedDirty<Schema>()
    declare $attributes: ReturnType<typeof TrackedDirty<Schema>>
  }

  const { prototype, naming } = merge(model, options)

  for (const key in attributes) {
    const {
      column = naming(key),
      take = identity,
      emit = identity,
    } = attributes[key]

    model.transforms[key] = { column, take, emit }

    defineProperty(prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
    })
  }

  type Schema = SchemaOf<Attrs>

  type ModelClass = Extend<
    typeof model,
    {
      new (...args: any[]): Model
    }
  >

  type Model = Extend<
    model,
    {
      $model: ModelClass
      $get<K extends keyof Schema>(key: K): Schema[K]
      $set<K extends keyof Schema>(key: K, value: Schema[K]): void
      $initial<K extends keyof Schema>(key: K): Schema[K]
      $didChange<K extends keyof Schema>(key: K): boolean
    }
  > &
    Schema

  return model as ModelClass
}

export function withClient<DB>(client: SupabaseClient<DB>, execute: () => any) {
  return BaseModel.withClient(client, execute)
}
