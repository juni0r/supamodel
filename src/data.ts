import 'dotenv/config'
import './luxon.inspect.custom'

import { createClient } from '@supabase/supabase-js'

import {
  configureSupamodel,
  defineModel,
  config,
  datetime,
  transforms,
  attr as as,
  zod,
  type ModelClass,
  type Scoped,
} from '.'

const { object, string, number, boolean } = zod

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env

configureSupamodel({
  extend: (model: ModelClass) =>
    class extends model {
      static findAll<T extends typeof model>(this: T, scoped?: Scoped) {
        console.log(`Finding all ${this.tableName}...`)
        return super.findAll<T>(scoped)
      }
    },
})

class Record extends defineModel({
  id: as(number()),
  firstName: as(string(), { column: 'given_name' }),
  lastName: as(string(), { column: 'family_name' }),
  email: as(string().email()),
  birthday: as(string(), { column: 'date_of_birth' }),
  score: as(number().int()),
  data: as(object({}).passthrough()),
  isOkay: as(boolean()),
  createdAt: as(datetime(), transforms.datetime),
}) {
  get name() {
    return `${this.firstName} ${this.lastName}`
  }
}

console.dir(config, { depth: 5 })

Record.withClient(
  createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!),
  async () => {
    const { data: records, error: recordsError } = await Record.findAll(
      (where) =>
        where
          .ilike('email', '%@mail.com')
          .gte('date_of_birth', '1974-01-01')
          .eq('is_okay', false),
    )
    if (recordsError) throw recordsError

    records.forEach((record) => console.log(record))

    console.log('\nUpdating record...')

    const { data: record, error: recordError } = await Record.find(
      +process.argv[2],
    )
    if (recordError) throw recordError

    console.log(record)

    if (record.lastName === 'Goldbacke') {
      record.lastName = 'Silberlocke'
      record.birthday = '1974-12-18'
      record.data = { mehr: 'info', neue: 'sichtweisen', viele: 'inhalte' }
    } else {
      record.lastName = 'Goldbacke'
      record.birthday = '1973-03-07'
      record.data = { weniger: 'drin' }
    }

    const { error: saveError } = await record.save()
    if (!saveError) {
      console.log('👍🏼 Updated')
      console.log(record)
    } else {
      console.warn('🖐️ ', saveError)
    }
  },
)
