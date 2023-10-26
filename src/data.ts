/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'

import { Database } from '../supabase/types'
import {
  defineModel,
  defineModelConfig,
  attr as $,
  transform,
  datetime,
  createClient,
} from './model'
import { string, number, object, boolean } from 'zod'

const { env, argv } = process

const client = createClient<Database>(env.SUPABASE_URL!, env.SUPABASE_ANON_KEY!)

defineModelConfig(client)

class Record extends defineModel({
  id: $(number(), { primary: true }),
  firstName: $(string(), { column: 'given_name' }),
  lastName: $(string(), { column: 'family_name' }),
  email: $(string().email()),
  birthday: $(string(), { column: 'date_of_birth' }),
  score: $(number()),
  data: $(object({}).passthrough()),
  isOkay: $(boolean()),
  createdAt: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.firstName} ${this.lastName}`
  }
}

Record.find(+argv[2]).then((record) => {
  record.lastName = 'Silberlocke'
  record.birthday = '1974-12-18'
  record.data = { ...record.data, kontroverse: 'meinungen' }
  console.log(record.toJSON())
  console.log(record)
})
