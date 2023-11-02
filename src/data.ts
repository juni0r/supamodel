import { Database } from '../supabase/types'
import {
  BaseModel,
  defineModel,
  defineModelConfig,
  config,
  transform,
  datetime,
  $,
  z,
  Scoped,
  withServiceRole,
} from '.'

class AppModel extends BaseModel<Database> {
  static findAll(scoped?: Scoped) {
    console.log(`Finding all ${this.tableName}...`)
    return super.findAll(scoped)
  }
  // static findAll<T extends typeof AppModel>(
  //   this: T,
  //   scoped?: Scoped<any> | undefined,
  // ) {
  //   console.log(`Finding all ${this.tableName}...`)
  //   return super.findAll(scoped) as Promise<InstanceType<T>[]>
  // }
}

defineModelConfig<Database>({
  base: AppModel,
  client: {
    url: process.env.SUPABASE_URL!,
    key: process.env.SUPABASE_KEY!,
    serviceKey: process.env.SUPABASE_SERVICE_KEY!,
  },
})

const { object, string, number, boolean } = z

console.dir(config(), { depth: 1 })

class Record extends defineModel<Database>({
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

console.log((Record.client as any).supabaseKey)

withServiceRole<Database>(() => {
  console.log((Record.client as any).supabaseKey)

  Record.findAll((where) =>
    where
      .ilike('email', '%@mail.com')
      .gte('date_of_birth', '1974-01-01')
      .eq('is_okay', false),
  )
    .then((records) => {
      console.dir(records)
      console.log((Record.client as any).supabaseKey)
    })
    .catch(console.error)
})

const r = new Record().$take({ first_name: 'Stella' })
r.firstName
// type X = Simplify<
//   (typeof Record)['client'] extends SupabaseClient<infer D, infer S, infer G>
//     ? [D, S, G]
//     : never
// >
// type Y = Simplify<
//   Record['$client'] extends SupabaseClient<infer D, infer S, infer G>
//     ? [D, S, G]
//     : never
// >

Record.find(+process.argv[2]).then(async (record) => {
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
