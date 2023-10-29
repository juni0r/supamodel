import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineModel, attr as $, transform } from '../src/model'
import { string, date, number, boolean } from 'zod'
import createClientMock from './support/clientMock'

describe('Model', () => {
  const client = createClientMock()
  class Record extends defineModel(
    {
      id: $(number().int()),
      name: $(string().min(1)),
      layer: $(number(), { column: 'z_index' }),
      isOkay: $(boolean()),
      date: $(date(), transform.date),
    },
    { client: client.mock },
  ) {}

  let record: Record

  beforeEach(() => {
    record = new Record({
      id: 123,
      name: 'Stella',
      z_index: 23,
      is_okay: true,
      date: '2020-02-02T02:02:02.020Z',
    })
  })

  afterEach(() => {
    client.reset()
  })

  it('mocks', async () => {
    record.name = 'zonk'
    record.layer = 42
    record.date = new Date('2121-12-12T12:12:12.121Z')

    client.on(/records update/, () => ({
      data: { name: 'name_returned' },
    }))

    const issues = await record.save()

    expect(issues.any).toBeFalsy()
    expect(record.name).toBe('name_returned')
  })
})