import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Record } from './models'
import { identity } from '../src/util'
import { CATNOM } from './fixtures/dbErrors'
import records from './fixtures/records'

describe('Model', () => {
  afterEach(() => {
    Record.client.$reset()
  })

  describe('findAll', () => {
    beforeEach(() => {
      Record.client.$on(/^from records select/, () => ({ data: records }))
    })

    it('loads instances', async () => {
      const { data: records, error } = await Record.findAll()

      expect(error).toBeNull()

      expect(records?.length).toBe(2)
      expect(records?.[0].toJSON()).toEqual({
        id: 1,
        name: 'Stella',
        layer: 478_300,
        isOkay: false,
        date: '2023-11-05T21:20:13.360Z',
      })
    })
  })

  describe('scoped', () => {
    beforeEach(() => {
      Record.client.$on(/^from records select/, () => ({ data: records }))
    })

    it('applies the scope', async () => {
      const scope = vi.fn(identity)

      const { data, error } = await Record.findAll(scope)

      expect(scope).toBeCalledWith(
        expect.arrayContaining(['from', 'records', 'select', "'*'"]),
      )
      expect(error).toBeNull()
      expect(data!.length).toBe(2)
    })
  })

  describe('with db error', () => {
    const cause = CATNOM

    beforeEach(() => {
      Record.client.$on(/^from records select/, () => ({ error: cause }))
    })

    it('fails with a cause', async () => {
      const { error } = await Record.findAll()
      expect(error!.cause).toBe(cause)
    })
  })

  describe('find', () => {
    beforeEach(() => {
      Record.client.$on(/^from records select/, () => ({ data: records[0] }))
    })

    it('loads instance', async () => {
      const { data: record, error } = await Record.find(1)

      expect(error).toBeNull()
      expect(record!.toJSON()).toEqual({
        id: 1,
        name: 'Stella',
        layer: 478_300,
        isOkay: false,
        date: '2023-11-05T21:20:13.360Z',
      })
    })
  })

  describe('with db error', () => {
    const cause = CATNOM

    beforeEach(() => {
      Record.client.$on(/^from records select/, () => ({ error: cause }))
    })

    it('fails with a cause', async () => {
      const { error } = await Record.find(1)
      expect(error!.cause).toBe(cause)
    })
  })
})
