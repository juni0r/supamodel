import type { maybe } from './types'
import { custom } from 'zod'
import { DateTime } from 'luxon'
export { DateTime }

export const datetime = () =>
  custom<DateTime>((val: unknown) =>
    val instanceof DateTime ? val.isValid : false,
  )

export const transform = {
  date: {
    take: (iso: maybe<string>) => new Date(iso ?? 'invalid'),
    emit: (date: maybe<Date>) => date?.toISOString() ?? '',
  },
  datetime: {
    take: (iso: maybe<string>) =>
      iso
        ? DateTime.fromISO(iso, { zone: 'utc' })
        : DateTime.invalid('empty ISO string'),
    emit: (date: maybe<DateTime>) => date?.toUTC().toISO() ?? '',
  },
}
