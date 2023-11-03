import { describe, it, expect, beforeEach } from 'vitest'
import { defineModel as model, $, transform, datetime, DateTime } from '../src'
import { string, date, number, boolean } from 'zod'

import defineModelConfig from './support/defineModelConfig'

describe('Model', () => {
  defineModelConfig()

  class Subject extends model({
    name: $(string()),
    position: $(number()),
    isOkay: $(boolean()),
    date: $(date(), transform.date),
    dateTime: $(datetime(), transform.datetime),
  }) {}

  let subject: Subject

  beforeEach(() => {
    subject = Subject.take({
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
    expect(subject.$didChange('name')).toBe(true)
    expect(subject.$initial('name')).toBe('Stella')

    subject.name = 'Stella'
    expect(subject.$isDirty).toBe(false)
    expect(subject.$didChange('name')).toBe(false)
  })

  it('is dirty when date property is changed', () => {
    const previous = new Date(subject.date)

    subject.date = new Date()
    expect(subject.$isDirty).toBe(true)
    expect(subject.$didChange('date')).toBe(true)
    expect(subject.$initial('date')).toEqual(previous)

    subject.date = previous
    expect(subject.$isDirty).toBe(false)
    expect(subject.$didChange('date')).toBe(false)
  })

  it('is dirty when datetime property is changed', () => {
    const previous = subject.dateTime.plus({})

    subject.dateTime = DateTime.now()
    expect(subject.$isDirty).toBe(true)
    expect(subject.$didChange('dateTime')).toBe(true)
    expect(subject.$initial('dateTime')).toEqual(previous)

    subject.dateTime = previous
    expect(subject.$isDirty).toBe(false)
    expect(subject.$didChange('dateTime')).toBe(false)
  })

  it('is dirty when boolean property is changed', () => {
    subject.isOkay = false
    expect(subject.$isDirty).toBe(true)
    expect(subject.$didChange('isOkay')).toBe(true)
    expect(subject.$initial('isOkay')).toEqual(true)

    subject.isOkay = true
    expect(subject.$isDirty).toBe(false)
    expect(subject.$didChange('isOkay')).toBe(false)
  })

  it('works with assign', () => {
    Object.assign(subject, {
      name: 'Steffi',
      date: new Date(2000, 0, 1),
    })

    expect(subject.$didChange('name')).toBe(true)
    expect(subject.$didChange('date')).toBe(true)

    expect(subject.name).toBe('Steffi')
    expect(subject.date).toEqual(new Date(2000, 0, 1))
  })
})
