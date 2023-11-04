import createClientMock from '../support/clientMock'
import { ModelConfigOptions, configureSupamodel } from '../../src'

const {
  SUPABASE_URL = '',
  SUPABASE_KEY = '',
  SUPABASE_SERVICE_KEY,
} = process.env

export const client = createClientMock(SUPABASE_URL, SUPABASE_KEY)

export const serviceClient = SUPABASE_SERVICE_KEY
  ? createClientMock(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : client

export default (config: Partial<ModelConfigOptions> = {}) =>
  configureSupamodel({ client, serviceClient, ...config })
