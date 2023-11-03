import type {
  mayBe,
  Attribute,
  AttributeOptions,
  Attributes,
  ShapeOf,
} from './types'
import {
  object,
  custom,
  ZodDefault,
  type ZodSchema,
  type AnyZodObject,
} from 'zod'
import { DateTime } from 'luxon'
import mapValues from 'lodash.mapvalues'

export function zodSchemaOf<A extends Attributes>(attributes: A) {
  return object(mapValues(attributes, 'type') as ShapeOf<A>)
}

export const identity = <T>(v: T) => v

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

export const transform = {
  date: {
    take: (iso: mayBe<string>) => new Date(iso ?? 'invalid'),
    emit: (date: mayBe<Date>) => date?.toISOString() ?? '',
  },
  datetime: {
    take: (iso: mayBe<string>) =>
      iso
        ? DateTime.fromISO(iso, { zone: 'utc' })
        : DateTime.invalid('unable to parse from empty ISO string'),
    emit: (date: mayBe<DateTime>) => date?.toUTC().toISO() ?? '',
  },
}

export function defaults<T>(schema: AnyZodObject): T {
  return mapValues(schema.shape, (attr) =>
    (attr as ZodSchema) instanceof ZodDefault
      ? attr._def.defaultValue()
      : attr.isNullable()
      ? null
      : undefined,
  ) as T
}
