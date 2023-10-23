import { describe, it, expect, beforeEach } from 'vitest'
import { model, transform } from '../src'
import { string, number, boolean } from 'zod'
import { DateTime } from 'luxon'

class Subject extends model({
  name: string(),
  position: number(),
  isOkay: boolean(),
  date: transform.date(),
  dateTime: transform.datetime(),
}) {}

describe('Model', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$takeAttributes({
      name: 'Stella',
      position: 23,
      is_okay: true,
      date: '2020-02-02T02:02:02.020Z',
      date_time: '2020-02-02T02:02:02.020Z',
    })
  })

  it("isn't dirty after taking attributes", () => {
    expect(subject.$isDirty).toBe(false)
  })

  it('is dirty when string property is changed', () => {
    subject.name = 'Henry'
    expect(subject.$isDirty).toBe(true)
    expect(subject.$changed.name).toBe(true)
    expect(subject.$dirty.name).toBe('Stella')

    subject.name = 'Stella'
    expect(subject.$isDirty).toBe(false)
    expect(subject.$changed.name).toBe(false)
  })

  it('is dirty when date property is changed', () => {
    const previous = new Date(subject.date)
    subject.date = new Date()
    expect(subject.$isDirty).toBe(true)
    expect(subject.$changed.date).toBe(true)
    expect(subject.$dirty.date).toEqual(previous)

    subject.date = previous
    expect(subject.$isDirty).toBe(false)
    expect(subject.$changed.date).toBe(false)
  })

  it('is dirty when datetime property is changed', () => {
    const previous = subject.dateTime.plus({})
    subject.dateTime = DateTime.now()
    expect(subject.$isDirty).toBe(true)
    expect(subject.$changed.dateTime).toBe(true)
    expect(subject.$dirty.dateTime).toEqual(previous)

    subject.dateTime = previous
    expect(subject.$isDirty).toBe(false)
    expect(subject.$changed.dateTime).toBe(false)
  })

  it('is dirty when boolean property is changed', () => {
    subject.isOkay = false
    expect(subject.$isDirty).toBe(true)
    expect(subject.$changed.isOkay).toBe(true)
    expect(subject.$dirty.isOkay).toEqual(true)

    subject.isOkay = true
    expect(subject.$isDirty).toBe(false)
    expect(subject.$changed.isOkay).toBe(false)
  })
})
