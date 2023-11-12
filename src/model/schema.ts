import type { Constructable } from 'mixwith.ts'
import type { Attributes, Extend, KeyMapper, SchemaOf } from '../types'
import { DirtyDict, New, snakeCase } from '../util'
import { defaultsOf, transformsOf, zodSchemaOf } from '../schema'
import Base from './base'

export interface Options {
  naming: KeyMapper
}
export const defaults: Options = { naming: snakeCase }

export default <Attrs extends Attributes>(
  attributes: Attrs,
  options: Partial<Options> = {},
) => {
  const { naming } = { ...defaults, ...options }

  return <T extends typeof Base>(base: T) => {
    type Schema = SchemaOf<Attrs>

    class AttributesMixin extends base {
      static naming = naming
      static schema = zodSchemaOf(attributes)
      static defaults = defaultsOf(attributes)
      static transforms = transformsOf(attributes, naming)
      static scope = New<Schema>()

      declare $attributes: DirtyDict<Schema>
    }

    for (const key in attributes) {
      Object.defineProperty(AttributesMixin.prototype, key, {
        get() {
          return this.$attributes[key]
        },
        set(value: unknown) {
          this.$attributes[key] = value
        },
      })
    }

    type AttributesClass = Extend<
      typeof AttributesMixin,
      Constructable<
        Extend<
          AttributesMixin,
          {
            $model: AttributesClass
            $initial<K extends keyof Schema>(key: K): Schema[K]
            $didChange<K extends keyof Schema>(key: K): boolean
          }
        > &
          Schema
      >
    >

    return AttributesMixin as AttributesClass
  }
}
