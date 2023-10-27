import 'dotenv/config'

import { Database } from '../supabase/types'
import { string, number, object, boolean } from 'zod'

import {
  createClient,
  defineModelConfig,
  defineModel,
  transform,
  datetime,
  attr as $,
} from './model'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env

defineModelConfig(createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!))

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
}) {}

const record = new Record({
  id: 5,
  given_name: 'Stella',
  family_name: 'Silberlocke',
  email: 'stella@mail.com',
  date_of_birth: '1974-12-18',
  score: 4395627846735478300,
  data: { mehr: 'info', neue: 'sichtweisen' },
  is_okay: false,
  created_at: '2023-10-25T00:29:24.748Z',
})

const emit = record.$emit()
console.log(emit)
console.log(record.toJSON())
// console.log(Record.$tableName)
