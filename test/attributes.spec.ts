import { describe, it, expect, beforeEach } from 'vitest'
import { defineModel, attr as $, datetime, transform } from '../src'
import { string, date, number } from 'zod'
import { DateTime } from 'luxon'

class Subject extends defineModel({
  id: $(number(), { primary: true }),

  givenName: $(string()),
  familyName: $(string(), { column: 'last_name' }),

  date: $(date(), transform.date),
  dateTime: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Attributes', () => {
  let subject: InstanceType<typeof Subject>

  beforeEach(() => {
    subject = new Subject({
      id: 123,
      given_name: 'Stella',
      last_name: 'Goldbacke',
      date: '2020-02-02T02:02:02.020Z',
      date_time: '2020-02-02T02:02:02.020Z',
    })
  })

  it('can be read', () => {
    expect(subject.id).toBe(123)
    expect(subject.givenName).toBe('Stella')
    expect(subject.familyName).toBe('Goldbacke')
  })

  it('can be set', () => {
    subject.givenName = 'Tom'
    expect(subject.name).toBe('Tom Goldbacke')
  })

  it('takes dates', () => {
    expect(subject.date).toBeInstanceOf(Date)
  })

  it('emits dates', () => {
    expect(subject.$emit().date).toBe('2020-02-02T02:02:02.020Z')
  })

  it('takes datetimes', () => {
    expect(subject.dateTime).toBeInstanceOf(DateTime)
  })

  it('emits datetimes', () => {
    expect(subject.$emit().date_time).toBe('2020-02-02T02:02:02.020Z')
  })
})

describe('Static attributes', () => {
  it('maps attribute keys to column keys', () => {
    expect(Subject.$attributes.familyName.column).toBe('last_name')
  })

  it('maps attribute keys to schemas', () => {
    expect(Subject.$schema.shape.familyName._def.typeName).toBe('ZodString')
  })
})
