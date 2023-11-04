import createClientMock from '../support/clientMock'
import { ModelConfigOptions, configureSupamodel } from '../../src'

export const client = createClientMock(
  'http://localhost:54321',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpcSeCreT',
)

export default (config: Partial<ModelConfigOptions> = {}) =>
  configureSupamodel({ client, ...config })
