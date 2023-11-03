import type { ModelConfig, ModelConfigOptions } from './types'
import { BaseModel, SupabaseClient, createClient, snakeCase } from '.'
import { New } from './util'

export function baseModel<DB = any>() {
  return class extends BaseModel {
    declare static client: SupabaseClient<DB>
    declare static serviceClient?: SupabaseClient<DB>
  }
}

export let isConfigured = false

export const _config = New<ModelConfig>()

export function config<DB>() {
  return _config as ModelConfig<DB>
}
export default config

export function defineModelConfig<DB = any>(options: ModelConfigOptions<DB>) {
  let { client, serviceClient, ...config } = options

  if (!(client instanceof SupabaseClient)) {
    const { url, key, serviceKey } = client

    client = createClient<DB>(url, key)

    if (serviceKey) {
      serviceClient ??= createClient<DB>(url, serviceKey)
    }
  }

  Object.assign(
    _config,
    { base: BaseModel, primaryKey: 'id' as const, naming: snakeCase },
    config,
  )
  Object.assign(_config.base, { client, serviceClient })

  isConfigured = true
}
