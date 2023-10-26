import { Database } from '../supabase/types'
import {
  defineModel,
  attr as $,
  transform,
  datetime,
  defineModelConfig,
} from './model'
import { string, number, object, boolean } from 'zod'

defineModelConfig<Database>({
  supabaseUrl: 'http://localhost:54321',
  supabaseKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
})

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
console.log(Record.$tableName)
