import { Model } from './model'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Attributes, ModelConfigOptions, ModelOptions } from './types'

export let baseModel: typeof Model = Model
export default baseModel

export function configureSupamodel<DB = any>({
  base,
  primaryKey,
  naming,
  client,
}: ModelConfigOptions<DB>) {
  if (base) baseModel = base
  if (naming) baseModel.naming = naming
  if (primaryKey) baseModel.primaryKey = primaryKey
  if (client) {
    baseModel.client = isSupabaseClient(client)
      ? client
      : createClient<DB>(client.url, client.key)
  }
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
