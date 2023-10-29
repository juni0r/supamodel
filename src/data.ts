import 'dotenv/config'

import { Database } from '../supabase/types'
import {
  createClient,
  defineModel,
  defineModelConfig,
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
  score: attr(z.number().int()),
  data: attr(z.object({}).passthrough()),
  isOkay: attr(z.boolean()),
  createdAt: attr(datetime(), transform.datetime),
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
    console.log(records.map((record) => record.toJSON()))
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
