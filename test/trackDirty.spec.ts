import { describe, it, expect, beforeEach } from 'vitest'
import { trackDirty } from '../src/trackDirty'

describe('trackDirty', () => {
  const subject = trackDirty({ foo: 42, bar: '23', baz: true })

  beforeEach(() => {
    subject.foo = 99
    subject.bar = '69'
  })

  it('is dirty', () => {
    expect(subject.$isDirty).toBe(true)
  })

  it('has changes', () => {
    expect(subject.$didChange('foo')).toBe(true)
    expect(subject.$didChange('bar')).toBe(true)
    expect(subject.$didChange('baz')).toBe(false)
  })

  it('has initial values', () => {
    expect(subject.$initial).toEqual({ foo: 42, bar: '23' })
  })

  describe('revert', () => {
    beforeEach(() => subject.$revert())

    it('restores original values', () => {
      expect(subject).toEqual({ foo: 42, bar: '23', baz: true })
    })

    it('clears initial values', () => {
      expect(subject.$initial).toEqual({})
    })

    it('clears dirty', () => {
      expect(subject.$isDirty).toBe(false)
    })

    it('clears changes', () => {
      expect(subject.$didChange('foo')).toBe(false)
      expect(subject.$didChange('bar')).toBe(false)
      expect(subject.$didChange('baz')).toBe(false)
    })
  })

  describe('commit', () => {
    beforeEach(() => subject.$commit())

    it('keeps changed values', () => {
      expect(subject).toEqual({ foo: 99, bar: '69', baz: true })
    })

    it('clears initial values', () => {
      expect(subject.$initial).toEqual({})
    })

    it('clears dirty', () => {
      expect(subject.$isDirty).toBe(false)
    })

    it('clears changes', () => {
      expect(subject.$didChange('foo')).toBe(false)
      expect(subject.$didChange('bar')).toBe(false)
      expect(subject.$didChange('baz')).toBe(false)
    })
  })
})
