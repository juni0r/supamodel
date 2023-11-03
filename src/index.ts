// if (typeof window === 'undefined') {
//   require('./luxon.inspect.custom')
// }
//
import 'dotenv/config'

export type * from './types'

export { z, z as zod } from 'zod'
export { DateTime } from 'luxon'

export { BaseModel } from './baseModel'
export { Issues } from './issues'
export { createClient, SupabaseClient } from './supabase'
export {
  configureSupabaseModel as defineModelConfig,
  config,
  baseModel,
} from './config'
export { defineModel, withServiceRole } from './model'
export { transform, datetime, attr, attr as $ } from './schema'
export { camelCase, snakeCase, kebabCase, pluralize } from './util'
export {
  RecordNotFound,
  RecordNotCreated,
  RecordNotUpdated,
  RecordNotDeleted,
} from './errors'
