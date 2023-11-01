// if (typeof window === 'undefined') {
//   require('./luxon.inspect.custom')
// }

export { BaseModel } from './baseModel'
export { Issues } from './issues'
export { transform, datetime, attr, attr as $ } from './schema'
export {
  defineModel,
  defineModel as model,
  defineModelConfig,
  withServiceRole,
} from './model'
export {
  RecordNotFound,
  RecordNotCreated,
  RecordNotUpdated,
  RecordNotDeleted,
} from './errors'

export { camelCase, snakeCase, kebabCase, pluralize } from './util'

export { createClient, SupabaseClient } from '@supabase/supabase-js'
export { DateTime } from 'luxon'
export { z, z as zod } from 'zod'

export type * from './types'
