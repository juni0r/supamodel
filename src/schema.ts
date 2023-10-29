import mapValues from 'lodash.mapvalues'
import { custom, ZodDefault, type ZodSchema, type AnyZodObject } from 'zod'
import { DateTime } from 'luxon'
import type { mayBe } from './types'

export const datetime = () =>
  custom<DateTime>((val: unknown) =>
    val instanceof DateTime ? val.isValid : false,
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
        : DateTime.invalid('empty ISO string'),
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
