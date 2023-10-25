/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js'
import { Database } from '../supabase/types'
import { defineModel, attr as $, transform, datetime } from '.'
import { string, number, object, boolean } from 'zod'

const supabase = createClient<Database>(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
)

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
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

supabase
  .from('records')
  .select('*')
  .eq('id', 6)
  .then(({ data, error }) => {
    if (error) {
      console.error(error)
      return
    }
    const [dbRecord] = data
    const record = new Record(dbRecord)

    console.log(record.toJSON())
  })
