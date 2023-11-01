import 'dotenv/config'

import { Database } from '../supabase/types'
import {
  createClient,
  model,
  defineModelConfig,
  transform,
  datetime,
  $,
  z,
} from '.'

const { object, string, number, boolean } = z
const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env

defineModelConfig({
  client: createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!),
})

class Record extends model({
  id: $(number()),
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

Record.findAll((where) =>
  where
    .ilike('email', '%@mail.com')
    .gte('date_of_birth', '1974-01-01')
    .eq('is_okay', false),
)
  .then((records) => {
    console.log(records)
    // console.log(records.map((record) => record.toJSON()))
    // records.forEach((record) => {
    //   console.log(JSON.stringify(record.$emit(), null, 2))
    //   // console.log(JSON.stringify(record.toJSON(), null, 2)),
    // })
  })
  .catch(console.error)

// Record.find(+process.argv[2]).then(async (record) => {
//   console.log(record)

//   if (record.lastName === 'Goldbacke') {
//     record.lastName = 'Silberlocke'
//     record.birthday = '1974-12-18'
//     record.data = { mehr: 'info', neue: 'sichtweisen', viele: 'inhalte' }
//   } else {
//     record.lastName = 'Goldbacke'
//     record.birthday = '1973-03-07'
//     record.data = { weniger: 'drin' }
//   }

//   return record
//     .save()
//     .then((issues) => {
//       if (issues.any) {
//         console.warn('🖐️ ', issues)
//         return
//       }
//       console.log('👍🏼 Updated')
//       console.log(record)
//     })
//     .catch((error) => console.error('💥', error))
// })
