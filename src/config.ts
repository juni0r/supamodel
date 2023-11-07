import { type SupabaseClient, createClient } from '@supabase/supabase-js'
import { snakeCase } from './util'
import { BaseModel } from './baseModel'
import type { ModelConfigOptions } from './types'

export let baseModel: typeof BaseModel = BaseModel
export default baseModel

export function configureSupamodel<DB = any>(options: ModelConfigOptions<DB>) {
  let { client, base, primaryKey, naming } = options

  if (base) baseModel = base
  if (client) {
    if (!isSupabaseClient(client)) {
      client = createClient<DB>(client.url, client.key)
    }
    BaseModel.client = client
  }
  if (naming) BaseModel.naming = naming
  if (primaryKey) BaseModel.primaryKey = primaryKey

  BaseModel.naming ??= snakeCase
  BaseModel.primaryKey ??= 'id' as const
}

export function supabaseEnv() {
  const { SUPABASE_URL: url, SUPABASE_KEY: key } = process.env

  if (!(url && key))
    throw new Error(
      `Failed to auto-configure supabase-model. Set SUPABASE_URL and SUPABASE_KEY environment variables, or specify 'client' option to  ${configureSupamodel.name}.`,
    )

  return { url, key }
}

export function isSupabaseClient(
  object: any,
): object is SupabaseClient<any, any, any> {
  return 'supabaseUrl' in object && 'supabaseKey' in object
}
