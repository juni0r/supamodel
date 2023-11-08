import { defineModel, $, transform, datetime } from '../src'
import { string, date, number, boolean } from 'zod'

import configureSupamodel from './support/configureSupamodel'

configureSupamodel()

export class Record extends defineModel({
  id: $(number().int().optional()),
  name: $(string().min(1).nullable()),
  layer: $(number().int().min(1), { column: 'z_index' }),
  isOkay: $(boolean().default(false)),
  date: $(
    date().default(() => new Date()),
    transform.date,
  ),
}) {}

export class Subject extends defineModel({
  id: $(number()),
  givenName: $(string()),
  familyName: $(string(), { column: 'last_name' }),
  score: $(number().default(0)),
  date: $(date(), transform.date),
  dateTime: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}
