/* eslint-disable @typescript-eslint/no-explicit-any */
import { Simplify } from 'type-fest'
import { BaseModel } from './baseModel'
import { Dict, New, snakeCase, zodSchemaOf } from './util'
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

  if (tableName) model.tableName = tableName
  if (client) model.client = client
  if (serviceClient) model.serviceClient = serviceClient

  const { prototype, transforms, columnNameOf, attributeNameOf } = model

  forEach(attributes, (option, attr) => {
    const column = (option.column ||= model.naming(attr))

    columnNameOf[attr] = column
    attributeNameOf[column] = attr

    if (option.take || option.emit) {
      transforms[column] = {
        take: option.take ?? ((v: unknown) => v),
        emit: option.emit ?? ((v: unknown) => v),
      }
    }

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
      new (...args: any): Simplify<
        Extend<
          model,
          {
            $model: typeof model
            $get<K extends keyof Schema>(key: K): Schema[K]
            $set<K extends keyof Schema>(key: K, value: Schema[K]): void
          }
        > &
          Schema
      >
    }
  >
}
