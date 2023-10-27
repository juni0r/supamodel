/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'

import { Database } from '../supabase/types'
import { string, number, object, boolean } from 'zod'

import {
  defineModel,
  defineModelConfig,
  attr as $,
  transform,
  datetime,
  createClient,
} from './model'

const {
  env: { SUPABASE_URL, SUPABASE_ANON_KEY },
  argv,
} = process

defineModelConfig({
  client: createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!),
})

class Record extends defineModel({
  id: $(number(), { primary: true }),
  firstName: $(string(), { column: 'given_name' }),
  lastName: $(string(), { column: 'family_name' }),
  email: $(string().email()),
  birthday: $(string(), { column: 'date_of_birth' }),
  score: $(number().int()),
  data: $(object({}).passthrough()),
  isOkay: $(boolean()),
  createdAt: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.firstName} ${this.lastName}`
  }
}

Record.find(+argv[2]).then(async (record) => {
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

  return record
    .save()
    .then((issues) => {
      if (issues.any) {
        console.warn('🖐️ ', issues)
        return
      }
      console.log('👍🏼 Updated')
      console.log(record)
    })
    .catch((error) => console.error('💥', error))
})
