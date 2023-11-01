import { createClient, SupabaseClient } from '.'
import { New, snakeCase } from './util'
import BaseModel from './baseModel'
import type { ModelConfig, ModelConfigOptions } from './types'

const _config = New<ModelConfig<unknown>>({
  base: BaseModel,
  naming: snakeCase,
  primaryKey: 'id' as const,
})

export function config<DB>() {
  return _config as ModelConfig<DB>
}
export default config

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
