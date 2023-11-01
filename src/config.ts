import { createClient, SupabaseClient } from '.'
import { New, snakeCase } from './util'
import BaseModel from './baseModel'
import type { ModelConfig, ModelConfigOptions } from './types'

export default config
export function config<DB>() {
  return _config as ModelConfig<DB>
}

const _config = New<ModelConfig>({
  base: BaseModel,
  naming: snakeCase,
  primaryKey: 'id' as const,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function defineModelConfig<DB = any>({
  client,
  serviceClient,
  ...options
}: ModelConfigOptions<DB>) {
  if (!(client instanceof SupabaseClient)) {
    const { url, anonKey, serviceKey } = client

    client = createClient<DB>(url, anonKey)

    if (serviceKey) {
      serviceClient = createClient<DB>(url, serviceKey)
    }
  }
  Object.assign(_config, {
    client,
    serviceClient,
    ...options,
  })
}
