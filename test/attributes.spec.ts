import { describe, it, expect, beforeEach } from 'vitest'
import { defineModel, attr as $, datetime, DateTime } from '../src/model'
import { string, date, number } from 'zod'

class Subject extends defineModel({
  id: $(number(), { primary: true }),

  givenName: $(string()),
  familyName: $(string(), { column: 'last_name' }),

  date: $(date(), {
    take: (iso: string) => new Date(iso),
    emit: (date: Date) => date?.toISOString(),
  }),
  dateTime: $(datetime(), {
    take: (iso: string) => DateTime.fromISO(iso),
    emit: (date: DateTime) => date.toUTC().toISO(),
  }),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Attributes', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject({
      id: 123,
      given_name: 'Stella',
      last_name: 'Goldbacke',
      date: '2020-02-02T02:02:02.020Z',
      date_time: '2020-02-02T02:02:02.020Z',
    })
  })

  it('can get', () => {
    expect(subject.$get('givenName')).toBe('Stella')
  })

  it('can set', () => {
    subject.$set('givenName', 'Tom')
    expect(subject.givenName).toBe('Tom')
  })

  it('has getters', () => {
    expect(subject.$id).toBe(123)
    expect(subject.id).toBe(123)
    expect(subject.givenName).toBe('Stella')
    expect(subject.familyName).toBe('Goldbacke')
  })

  it('has setters', () => {
    subject.givenName = 'Tom'
    expect(subject.givenName).toBe('Tom')
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
    expect(Subject.attributeToColumn.familyName).toBe('last_name')
  })

  it('transforms attributes', () => {
    const date = '2020-02-02T20:20:20.020Z'
    expect(Subject.transforms.date_time.emit?.(DateTime.fromISO(date))).toBe(
      date,
    )
  })

  it('maps attribute keys to schemas', () => {
    expect(Subject.schema.shape.familyName._def.typeName).toBe('ZodString')
  })
})
