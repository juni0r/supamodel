import util, { type CustomInspectFunction } from 'node:util'
import { DateTime } from 'luxon'

Object.defineProperty(
  /*****************/
  DateTime.prototype,
  util.inspect.custom,
  {
    value(this: DateTime, _depth, { stylize }) {
      return [
        stylize(`LXN`, 'undefined'),
        this.invalidReason
          ? stylize(`[${this.invalidReason}]`, 'date')
          : stylize(this.toISO() ?? '[null]', 'special'),
      ].join(' ')
    },
  } as {
    value: CustomInspectFunction
  },
)
