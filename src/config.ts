import { BaseModel, SupabaseClient, createClient, snakeCase } from '.'
import { New } from './util'

import type { ModelConfig, ModelConfigOptions } from './types'

const _config = New<ModelConfig>()

export let isConfigured = false

export default config
export function config<DB>() {
  return _config as ModelConfig<DB>
}

export function defineModelConfig<DB = any>(options: ModelConfigOptions<DB>) {
  let { client, serviceClient, ...config } = options

  if (!(client instanceof SupabaseClient)) {
    const { url, key, serviceKey } = client

    client = createClient<DB>(url, key)
    if (serviceKey) {
      serviceClient ??= createClient<DB>(url, serviceKey)
    }
  }
  serviceClient ??= client

  Object.assign(
    _config,
    { base: BaseModel<DB>, primaryKey: 'id' as const, naming: snakeCase },
    config,
  )
  Object.assign(_config.base, { client, serviceClient })

  isConfigured = true
}
