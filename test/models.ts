import { defineModel, attr as as, transforms, datetime } from '../src'
import { string, date, number, boolean } from 'zod'
import configureSupamodel from './support/configureSupamodel'

configureSupamodel()

export class Record extends defineModel({
  id: as(number().int().optional()),
  name: as(string().min(1).nullable()),
  layer: as(number().int().min(1), { column: 'z_index' }),
  isOkay: as(boolean().default(false)),
  date: as(
    date().default(() => new Date()),
    transforms.date,
  ),
}) {}

export class Subject extends defineModel({
  id: as(number()),
  givenName: as(string()),
  familyName: as(string(), { column: 'last_name' }),
  score: as(number().default(0)),
  isOkay: as(boolean().default(false)),
  date: as(date(), transforms.date),
  dateTime: as(datetime(), transforms.datetime),
}) {}
