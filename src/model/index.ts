import { mix } from 'mixwith.ts'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import merge from 'lodash.merge'

import Base from './base'
import Schema, { defaults as schemaConfig } from './schema'
import Persistence, { defaults as persistenceConfig } from './persistence'

import type {
  Attributes,
  ModelConfig,
  ModelConfigOptions,
  ModelOptions,
} from '../types'

export let config: ModelConfig = {
  client: null as unknown as SupabaseClient,
  ...schemaConfig,
  ...persistenceConfig,
}

export function configureSupamodel<Ext extends ModelClass>({
  client,
  ...options
}: ModelConfigOptions<Ext>) {
  client &&= isSupabaseClient(client)
    ? client
    : createClient(client.url, client.key)
  merge(config, options, { client })
}

export function defineModel<Attrs extends Attributes>(
  attributes: Attrs,
  _options?: ModelOptions<Attrs>,
) {
  const { extend, ...options } = { ...config, ..._options } as ModelConfig

  return mix(Base).with(
    Schema(attributes, options),
    Persistence(options),
    ...(extend ? [extend] : []),
  )
}
const model = () => mix(Base).with(Persistence())
export type ModelClass = ReturnType<typeof model>

function isSupabaseClient(object: any): object is SupabaseClient {
  return 'supabaseUrl' in object && 'supabaseKey' in object
}
