import mapValues from 'lodash.mapvalues'
import _transform from 'lodash.transform'
import { DateTime } from 'luxon'
import { object, custom, ZodDefault, ZodNullable, ZodOptional } from 'zod'
import type { ZodSchema, ZodTypeAny, deoptional } from 'zod'

import type {
  mayBe,
  Attribute,
  AttributeOptions,
  Attributes,
  ShapeOf,
  AnyObject,
  DefaultsOf,
} from './types'

export function zodSchemaOf<A extends Attributes>(attributes: A) {
  return object(mapValues(attributes, 'type') as ShapeOf<A>)
}

export function attr<Z extends ZodSchema>(
  type: Z,
  options?: AttributeOptions<Z>,
) {
  return { type, ...options } as Attribute<Z>
}

export const datetime = () =>
  custom<DateTime>(
    (val: unknown) => (val instanceof DateTime ? val.isValid : false),
    { message: 'Invalid DateTime', params: { code: 'invalid-datetime' } },
  )

function dateFromISO(iso: mayBe<string>) {
  return new Date(iso ?? 'invalid')
}

function ISOFromDate(date: mayBe<Date>) {
  return date?.toISOString() ?? ''
}

function dateTimeFromISO(iso: mayBe<string>) {
  return iso
    ? DateTime.fromISO(iso, { zone: 'utc' })
    : DateTime.invalid('unable to parse from empty ISO string')
}

function ISOFromDateTime(date: mayBe<DateTime>) {
  return date?.toUTC().toISO() ?? ''
}

export const transforms = {
  date: {
    take: dateFromISO,
    emit: ISOFromDate,
  },
  datetime: {
    take: dateTimeFromISO,
    emit: ISOFromDateTime,
  },
}

export function deoptional<T extends ZodTypeAny>(type: T) {
  if (type instanceof ZodOptional) {
    type = deoptional(type.unwrap())
  } else if (type instanceof ZodNullable) {
    type = ZodNullable.create(deoptional(type.unwrap())) as any
  }
  return type as deoptional<T>
}

export function defaultsOf<T extends Attributes>(attrs: T) {
  return _transform(
    attrs,
    (defaults, { type }, key) => {
      type = deoptional(type)

      if (type instanceof ZodNullable) {
        defaults[key] = () => null
      } else if (type instanceof ZodDefault) {
        defaults[key] = type._def.defaultValue
      }
    },
    {} as AnyObject,
  ) as DefaultsOf<T>
}

// export function defaultsOf<S extends ZodRawShape>(shape: S) {
//   return _transform(
//     shape,
//     (defaults, schema, key) => {
//       schema = deoptional(schema)

//       if (schema instanceof ZodNullable) {
//         defaults[key] = () => null
//       } else if (schema instanceof ZodDefault) {
//         defaults[key] = schema._def.defaultValue
//       }
//     },
//     {} as AnyObject,
//   ) as DefaultsOf<S>
// }
