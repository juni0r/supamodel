import util, { type CustomInspectFunction } from 'node:util'
import { DateTime } from 'luxon'

declare module 'luxon' {
  interface DateTime {
    [util.inspect.custom]: CustomInspectFunction
  }
}

DateTime.prototype[util.inspect.custom] = function (_depth, { stylize }) {
  const value = this.toISO()
  return value
    ? [stylize(`LUXON`, 'undefined'), stylize(value, 'special')].join(' ')
    : stylize('[invalid date]', 'special')
}
