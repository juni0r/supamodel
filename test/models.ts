import { defineModel, $, transforms, datetime } from '../src'
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
    transforms.date,
  ),
}) {}

export class Subject extends defineModel({
  id: $(number()),
  givenName: $(string()),
  familyName: $(string(), { column: 'last_name' }),
  score: $(number().default(0)),
  isOkay: $(boolean().default(false)),
  date: $(date(), transforms.date),
  dateTime: $(datetime(), transforms.datetime),
}) {}
