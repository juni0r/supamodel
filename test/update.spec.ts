import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Record } from './models'
import { CATNOM } from './fixtures/dbErrors'

describe('Model update', () => {
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

  describe('valid', () => {
    beforeEach(() => {
      Record.client.$on(/^from records update/, () => ({
        data: { name: 'name_returned' },
      }))

      record.name = 'zonk'
      record.layer = 42
      record.date = new Date('2121-12-12T12:12:12.121Z')
    })

    it('succeeds', async () => {
      const { data, error } = await record.save()

      expect(data).toBe(record)
      expect(error).toBeNull()
    })

    it('assigns and commits updated attributes', async () => {
      expect(record.$isDirty).toBe(true)

      await record.save()

      expect(record.$attributes).toEqual({
        id: 1,
        name: 'name_returned',
        layer: 42,
        isOkay: true,
        date: new Date('2121-12-12T12:12:12.121Z'),
      })
      expect(record.$isDirty).toBe(false)
    })
  })

  describe('invalid', () => {
    beforeEach(() => {
      record.name = ''
      record.layer = 0
    })

    it('fails with issues', async () => {
      const { error } = await record.save()

      expect(error!.issues.any).toBe(true)
      expect(error!.issues.map((i) => i.path[0])).toEqual(['name', 'layer'])
    })
  })

  describe('with db error', () => {
    const cause = CATNOM

    beforeEach(() => {
      Record.client.$on(/^from records update/, () => ({
        error: cause,
      }))
    })

    it('fails with a cause', async () => {
      const { error } = await record.save({ onlyChanges: false })

      expect(error!.issues.none).toBe(true)
      expect(error!.cause).toBe(cause)
    })
  })
})
