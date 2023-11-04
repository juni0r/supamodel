import type { ModelConfig, ModelConfigOptions } from './types'

import { createClient, SupabaseClient } from './supabase'
import { New, snakeCase } from './util'
import { BaseModel } from './baseModel'

export let isConfigured = false

export const _config = New<ModelConfig>({
  base: BaseModel,
  primaryKey: 'id' as const,
  naming: snakeCase,
})

export function config<DB>() {
  return _config as ModelConfig<DB>
}
export default config

export function configureSupamodel<DB = any>(
  options: ModelConfigOptions<DB>,
): ModelConfig<DB> {
  let { client = supabaseEnv(), serviceClient, ...config } = options

  if (!(client instanceof SupabaseClient)) {
    const { url, key, serviceKey } = client

    client = createClient<DB>(url, key)

    if (serviceKey) {
      serviceClient ??= createClient<DB>(url, serviceKey)
    }
  }

  const { base } = Object.assign(_config, config)

  base.client = client
  base.serviceClient = serviceClient ?? client

  isConfigured = true

  return _config
}

export function baseModel<DB = any>() {
  return class extends BaseModel {
    declare static client: SupabaseClient<DB>
    declare static serviceClient: SupabaseClient<DB>
  }
}

function supabaseEnv() {
  const {
    SUPABASE_URL: url,
    SUPABASE_KEY: key,
    SUPABASE_SERVICE_KEY: serviceKey,
  } = process.env

  if (!(url && key))
    throw new Error(
      `Failed to auto-configure supabase-model. Set SUPABASE_URL and SUPABASE_KEY environment variables, or specify 'client' option to  ${configureSupamodel.name}.`,
    )

  return { url, key, serviceKey }
}
