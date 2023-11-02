// if (typeof window === 'undefined') {
//   require('./luxon.inspect.custom')
// }
//
import 'dotenv/config'

export type * from './types'

export { createClient, SupabaseClient } from '@supabase/supabase-js'
export { z, z as zod } from 'zod'
export { DateTime } from 'luxon'

export { BaseModel } from './baseModel'
export { Issues } from './issues'

export { defineModel, withServiceRole } from './model'
export { camelCase, snakeCase, kebabCase, pluralize } from './util'
export { transform, datetime, attr, attr as $ } from './schema'
export { defineModelConfig, config, baseModel } from './config'

export {
  RecordNotFound,
  RecordNotCreated,
  RecordNotUpdated,
  RecordNotDeleted,
} from './errors'
