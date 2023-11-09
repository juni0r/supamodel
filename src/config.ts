import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { snakeCase } from './util'
import { Model } from './model'
import type { Attributes, ModelConfigOptions, ModelOptions } from './types'

export let baseModel: typeof Model = Model
export default baseModel

export function configureSupamodel<DB = any>(options: ModelConfigOptions<DB>) {
  let { client, base, primaryKey, naming } = options

  if (base) baseModel = base
  if (client) {
    if (!isSupabaseClient(client)) {
      client = createClient<DB>(client.url, client.key)
    }
    Model.client = client
  }
  if (naming) Model.naming = naming
  if (primaryKey) Model.primaryKey = primaryKey

  Model.naming ??= snakeCase
  Model.primaryKey ??= 'id' as const
}

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  options: Partial<ModelOptions> = {},
) {
  return baseModel.extend(attributes, options)
}

export function withClient<DB>(client: SupabaseClient<DB>, execute: () => any) {
  return baseModel.withClient(client, execute)
}

function isSupabaseClient(
  object: any,
): object is SupabaseClient<any, any, any> {
  return 'supabaseUrl' in object && 'supabaseKey' in object
}
