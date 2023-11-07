import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Record } from './models'
import { CATNOM } from './fixtures/dbErrors'

describe('Model create', () => {
  let record: Record

  const attributes = Object.freeze({
    name: 'Stella',
    z_index: 23,
    is_okay: false,
    date: '2020-02-02T02:02:02.020Z',
  })

  afterEach(() => {
    Record.client.$reset()
  })

  describe('valid', () => {
    beforeEach(() => {
      Record.client.$on(/^from records insert/, () => ({
        data: { id: 1, ...attributes },
      }))
      record = new Record()
      record.name = 'Stella'
      record.layer = 23
    })

    it('succeeds', async () => {
      const { data, error } = await record.save()

      expect(data).toBe(record)
      expect(error).toBeNull()
    })

    it('assigns and commits updated attributes', async () => {
      expect(record.$isDirty).toBe(true)

      await record.save()

      expect(record.$isDirty).toBe(false)
      expect(record.$attributes).toEqual({
        id: 1,
        name: 'Stella',
        layer: 23,
        isOkay: false,
        date: new Date('2020-02-02T02:02:02.020Z'),
      })
    })
  })

  describe('invalid', () => {
    beforeEach(() => {
      record = new Record()
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
      Record.client.$on(/^from records insert/, () => ({
        error: cause,
      }))
      record = new Record()
      record.name = 'Stella'
      record.layer = 23
    })

    it('fails with a cause', async () => {
      const { error } = await record.save()

      expect(error!.issues.none).toBe(true)
      expect(error!.cause).toBe(cause)
    })
  })
})
