import { custom } from 'zod'
import { DateTime } from 'luxon'
import util, { type CustomInspectFunction } from 'node:util'

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

declare module 'luxon' {
  interface DateTime {
    [util.inspect.custom]: CustomInspectFunction
  }
}

DateTime.prototype[util.inspect.custom] = function (_depth, options) {
  const value = this.toISO()
  return value
    ? options.stylize(`[ ${value} ]`, 'date')
    : options.stylize('[invalid date]', 'special')
}
