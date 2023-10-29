import 'dotenv/config'

import { Database } from '../supabase/types'

import {
  createClient,
  defineModelConfig,
  defineModel,
  transform,
  datetime,
  attr,
  z,
} from '.'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env

defineModelConfig({
  client: createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!),
})

class Record extends defineModel({
  id: attr(z.number()),
  firstName: attr(z.string(), { column: 'given_name' }),
  lastName: attr(z.string(), { column: 'family_name' }),
  email: attr(z.string().email()),
  birthday: attr(z.string(), { column: 'date_of_birth' }),
  score: attr(z.number()),
  data: attr(z.object({}).passthrough()),
  isOkay: attr(z.boolean()),
  createdAt: attr(datetime(), transform.datetime),
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
console.log(Record.tableName)
