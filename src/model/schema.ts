import type { BaseClass } from './base'
import type { Attributes, Extend, KeyMapper, SchemaOf } from '../types'
import { defaultsOf, transformsOf, zodSchemaOf } from '../schema'
import { DirtyDict, New, snakeCase } from '../util'

export interface Config {
  naming: KeyMapper
}
export const defaults: Config = { naming: snakeCase }

export default <Attrs extends Attributes>(
  attributes: Attrs,
  options: Partial<Config> = {},
) => {
  const { naming } = { ...defaults, ...options }

  return function mixin<T extends BaseClass>(base: T) {
    type Schema = SchemaOf<Attrs>

    class SchemaMixin extends base {
      static naming = naming
      static schema = zodSchemaOf(attributes)
      static defaults = defaultsOf(attributes)
      static transforms = transformsOf(attributes, naming)
      static scope = New<Partial<Schema>>()

      declare $attributes: DirtyDict<Schema>
    }

    for (const key in attributes) {
      Object.defineProperty(SchemaMixin.prototype, key, {
        get() {
          return this.$attributes[key]
        },
        set(value: unknown) {
          this.$attributes[key] = value
        },
      })
    }

    type MixinClass = Extend<
      typeof SchemaMixin,
      {
        new (...args: any): Extend<
          SchemaMixin,
          {
            $model: MixinClass
            $initial<K extends keyof Schema>(key: K): Schema[K]
            $didChange<K extends keyof Schema>(key: K): boolean
          }
        > &
          Schema
      }
    >

    return SchemaMixin as MixinClass
  }
}
