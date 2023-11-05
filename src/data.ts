import 'dotenv/config'
import './luxon.inspect.custom'
import {
  withClient,
  configureSupamodel,
  defineModel,
  BaseModel,
  config,
  datetime,
  transform,
  $,
  z,
} from '.'
import type { Database } from '../supabase/types'
import type { Scoped } from './types'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env

export class Model extends BaseModel {
  static findAll<T extends typeof Model>(
    this: T,
    scoped?: Scoped,
  ): Promise<InstanceType<T>[]> {
    console.log(`Finding all ${this.tableName}...`)
    return super.findAll<T>(scoped)
  }
}

configureSupamodel<Database>({ base: Model })

console.dir(config(), { depth: 1 })

class Record extends defineModel({
  id: $(z.number()),
  firstName: $(z.string(), { column: 'given_name' }),
  lastName: $(z.string(), { column: 'family_name' }),
  email: $(z.string().email()),
  birthday: $(z.string(), { column: 'date_of_birth' }),
  score: $(z.number().int()),
  data: $(z.object({}).passthrough()),
  isOkay: $(z.boolean()),
  createdAt: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.firstName} ${this.lastName}`
  }
}

withClient(createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!), async () => {
  const records = await Record.findAll((where) =>
    where
      .ilike('email', '%@mail.com')
      .gte('date_of_birth', '1974-01-01')
      .eq('is_okay', false),
  )
  records.forEach((record) => console.log(record))

  console.log('\nUpdating record...')

  const record = await Record.find(+process.argv[2])
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

  const issues = await record.save()
  if (issues.none) {
    console.log('👍🏼 Updated')
    console.log(record)
  } else {
    console.warn('🖐️ ', issues)
  }
})
