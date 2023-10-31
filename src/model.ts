/* eslint-disable @typescript-eslint/no-explicit-any */
import { Simplify } from 'type-fest'
import type {
  ModelConfig,
  Attributes,
  Transform,
  SchemaOf,
  Extend,
  ModelOptions,
} from './baseTypes'
import { BaseModel } from './baseModel'
import { New, keysOf, snakeCase, zodSchemaOf } from './util'

const modelOptions = New<ModelConfig>()

export function defineModelConfig(options: ModelConfig) {
  Object.assign(modelOptions, options)
}

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  options: ModelOptions = {},
) {
  const { naming, primaryKey, tableName, client } = {
    naming: snakeCase,
    primaryKey: 'id' as const,
    ...modelOptions,
    ...options,
  }
  type Schema = SchemaOf<Attrs>

  class model extends BaseModel {
    static client = client
    static attributes = attributes
    static schema = zodSchemaOf(attributes)
    static transforms = New<Record<string, Transform>>()
    static naming = naming
    static tableName = tableName!
    static primaryKey = primaryKey

    static attributeToColumn = New<Record<keyof Attrs, string>>()
    static columnToAttribute = New<Record<string, keyof Attrs>>()
  }

  const { transforms, attributeToColumn, columnToAttribute } = model

  keysOf(attributes).forEach((attr) => {
    const option = attributes[attr]
    const column = (option.column ||= model.naming(attr))

    attributeToColumn[attr] = column
    columnToAttribute[column] = attr

    if (option.take || option.emit) {
      transforms[column] = {
        take: option.take ?? ((v: unknown) => v),
        emit: option.emit ?? ((v: unknown) => v),
      }
    }

    Object.defineProperty(model.prototype, attr, {
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
      new (...args: any): Simplify<
        Extend<
          model,
          {
            $get<K extends keyof Schema>(key: K): Schema[K]
            $set<K extends keyof Schema>(key: K, value: Schema[K]): void
          }
        > &
          Schema
      >
    }
  >
}
