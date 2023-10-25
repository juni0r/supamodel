/* eslint-disable @typescript-eslint/no-explicit-any */
import { Simplify } from 'type-fest'
import { TypeOf, ZodSchema, number, object, string } from 'zod'

import pick from 'lodash.pick'
import forEach from 'lodash.foreach'
import mapValues from 'lodash.mapvalues'
import snakeCase from 'lodash.snakecase'
import type { Attributes } from './types'

class Attribute<Z extends ZodSchema = ZodSchema> {
  type: Z
  column: string
  primary: boolean

  take?: (value: unknown) => TypeOf<Z>
  emit?: (value: TypeOf<Z>) => unknown

  constructor(options?: Attribute<Z>) {
    Object.assign(this, options)
  }
}

const attr = <Z extends ZodSchema>(
  type: Z,
  options?: Partial<Omit<Attribute<Z>, 'type'>>,
) => new Attribute({ type, primary: false, column: '', ...options })

type Infer<
  M extends Record<string, { type: ZodSchema } | { type: undefined }>,
> = {
  [k in keyof M]: M[k] extends { type: ZodSchema }
    ? M[k]['type']['_output']
    : never
}

type TypedAttributes<T> = {
  [k in keyof T]: T[k] extends Attribute<any> ? T[k] : never
}

// type SchemaFrom<P extends Properties> = {
//   [key in keyof P]: P[key] extends Property ? P[key]['type'] : never
// }

function defineModel<Attrs = Record<string, Attribute>>({
  props,
}: {
  props: TypedAttributes<Attrs>
}) {
  const columns = mapValues(props, (attr, key) => {
    attr.column ||= snakeCase(key)
    return attr
  }) as TypedAttributes<Attrs>

  type Schema = Infer<typeof columns>

  class model {
    static $columns = columns
    static $schema = object(
      mapValues(columns, 'type') as {
        [key in keyof Attrs]: Attrs[key] extends Attribute<any>
          ? Attrs[key]['type']
          : never
      },
    )

    $attributes: Attributes = {}

    constructor(value?: Attributes) {
      this.$attributes = value ?? {}
    }

    get $model() {
      return model
    }

    protected $get<K extends keyof Schema>(key: K) {
      return this.$attributes[model.$columns[key].column!] as Schema[K]
    }

    protected $set<K extends keyof Schema>(key: K, value: Schema[K]) {
      this.$attributes[model.$columns[key].column!] = value
    }
  }

  const { prototype } = model

  forEach(columns, (option, key) => {
    return Object.defineProperty(prototype, key, {
      get() {
        return this.$get(key)
      },
      set(value: unknown) {
        this.$set(key, value)
      },
      ...pick(option, 'get', 'set'),
    })
  })

  return model as {
    new (value?: Attributes): Simplify<model & Infer<typeof model.$columns>>
  }
}

const model = defineModel({
  props: {
    id: attr(number(), { primary: true }),
    firstName: attr(string()),
    lastName: attr(string(), {
      column: 'family_name',
      take: (val: unknown) => `${val}-McCain`,
      emit: (val: string) => val,
    }),
  },
})

const m = new model({
  id: 12345,
  first_name: 'Stella',
  family_name: 'Goldbacke',
})

console.log(m.$attributes)
console.log(m.id)
console.log(m.firstName)
console.log(m.lastName)
console.log(m.$model.$columns.lastName.column)
console.log(m.$model.$schema.shape.lastName)
