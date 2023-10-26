/* eslint-disable @typescript-eslint/no-explicit-any */
import 'dotenv/config'

import { Database } from '../supabase/types'
import {
  defineModel,
  defineModelConfig,
  attr as attr_,
  transform,
  datetime,
  createClient,
} from './model'
import { string, number, object, boolean } from 'zod'

const {
  env: { SUPABASE_URL, SUPABASE_ANON_KEY },
  argv,
} = process

defineModelConfig(createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!))

// prettier-ignore
class Record extends defineModel({
  id:         attr_(number(), { primary: true }),
  firstName:  attr_(string(), { column: 'given_name' }),
  lastName:   attr_(string(), { column: 'family_name' }),
  email:      attr_(string().email()),
  birthday:   attr_(string(), { column: 'date_of_birth' }),
  score:      attr_(number()),
  data:       attr_(object({}).passthrough()),
  isOkay:     attr_(boolean()),
  createdAt:  attr_(datetime(), transform.datetime),
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
