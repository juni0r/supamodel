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
  givenName: $(string()),
  familyName: $(string()),
  email: $(string().email()),
  birthday: $(string(), { column: 'date_of_birth' }),
  score: $(number()),
  data: $(object({}).passthrough()),
  isOkay: $(boolean()),
  createdAt: $(datetime(), transform.datetime),
}) {}

const record = new Record({})

console.log(record.createdAt)
// console.log(Record.$tableName)
