import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { defineModel, $, transform } from '../src'
import { string, date, number, boolean } from 'zod'

import defineModelConfig from './support/defineModelConfig'

describe('Model', () => {
  defineModelConfig()

  class Record extends defineModel({
    id: $(number().int()),
    name: $(string().min(1)),
    layer: $(number(), { column: 'z_index' }),
    isOkay: $(boolean()),
    date: $(date(), transform.date),
  }) {}

  let record: Record

  beforeEach(() => {
    record = Record.take({
      id: 123,
      name: 'Stella',
      z_index: 23,
      is_okay: true,
      date: '2020-02-02T02:02:02.020Z',
    })
  })

  afterEach(() => {
    Record.client.$reset()
  })

  it('mocks', async () => {
    record.name = 'zonk'
    record.layer = 42
    record.date = new Date('2121-12-12T12:12:12.121Z')

    Record.client.$on(/^from records update/, () => ({
      data: { name: 'name_returned' },
    }))

    const issues = await record.save()

    expect(issues.any).toBeFalsy()
    expect(record.name).toBe('name_returned')
  })
})
