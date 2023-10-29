import { custom } from 'zod'
import { DateTime } from 'luxon'
export { DateTime }

export const datetime = () =>
  custom<DateTime>((val: unknown) =>
    val instanceof DateTime ? val.isValid : false,
  )

export const transform = {
  date: {
    take: (iso: string) => new Date(iso),
    emit: (date: Date) => date?.toISOString(),
  },
  datetime: {
    take: (iso: string) => DateTime.fromISO(iso, { zone: 'utc' }),
    emit: (date: DateTime) => date.toUTC().toISO(),
  },
}
