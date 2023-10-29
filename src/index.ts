// if (typeof window === 'undefined') {
//   require('./luxon.inspect.custom')
// }

export { defineModel, defineModel as model, defineModelConfig } from './model'

export { Issues } from './issues'

export {
  RecordNotFound,
  RecordNotCreated,
  RecordNotUpdated,
  RecordNotDeleted,
} from './errors'

export { transform, datetime } from './schema'
export {
  attr,
  attr as $,
  camelCase,
  snakeCase,
  kebabCase,
  pluralize,
} from './util'

export { createClient, type SupabaseClient } from '@supabase/supabase-js'
export { DateTime } from 'luxon'
export { z, z as zod } from 'zod'

export type * from './types'
