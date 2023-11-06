import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Record } from './models'
import { CATNOM } from './fixtures/dbErrors'

describe('Model', () => {
  let record: Record

  beforeEach(() => {
    record = Record.take({
      id: 1,
      name: 'Stella',
      z_index: 23,
      is_okay: true,
      date: '2020-02-02T02:02:02.020Z',
    })
  })

  afterEach(() => {
    Record.client.$reset()
  })

  describe('delete', () => {
    beforeEach(() => {
      Record.client.$on(/^from records delete/, () => ({ data: 'ok' }))
    })

    it('succeeds', async () => {
      const { data, error } = await record.delete()
      expect(data).toBe(record)
      expect(error).toBeNull()
    })

    it('sets $isDeleted', async () => {
      expect(record.$isDeleted).toBe(false)
      await record.delete()
      expect(record.$isDeleted).toBe(true)
    })
  })

  describe('delete with db error', () => {
    const cause = CATNOM

    beforeEach(() => {
      Record.client.$on(/^from records delete/, () => ({
        error: cause,
      }))
    })

    it('fails with a cause', async () => {
      const { error } = await record.delete()
      expect(error!.cause).toBe(cause)
    })
  })
})
