import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { mix } from 'mixwith.ts'

import Base from './base'
import Schema, { defaults as schemaDefaults } from './schema'
import Persistence, { defaults as persistenceDefaults } from './persistence'

import merge from 'lodash.merge'

import type {
  Attributes,
  ModelConfig,
  ModelConfigOptions,
  ModelOptions,
} from '../types'

export let config: ModelConfig = {
  client: null as unknown as SupabaseClient,
  ...schemaDefaults,
  ...persistenceDefaults,
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
  modelOptions?: ModelOptions<Attrs>,
) {
  const { extend, ...options } = { ...config, ...modelOptions } as ModelConfig
  return mix(Base).with(
    Schema(attributes, options),
    Persistence(options),
    ...(extend ? [extend] : []),
  )
}

const Model = () => mix(Base).with(Persistence())
export type ModelClass = ReturnType<typeof Model>

function isSupabaseClient(object: any): object is SupabaseClient {
  return 'supabaseUrl' in object && 'supabaseKey' in object
}
