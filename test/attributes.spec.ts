import { DateTime } from 'luxon'
import { describe, it, expect, beforeEach } from 'vitest'
import { model, transform } from '../src'
import { string } from 'zod'

class Subject extends model({
  givenName: string(),
  familyName: string(),
  date: transform.date(),
  dateTime: transform.datetime(),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Model attributes', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$takeAttributes({
      given_name: 'Stella',
      family_name: 'Goldbacke',
      date: '2020-02-02T02:02:02Z',
      date_time: '2020-02-02T02:02:02Z',
    })
  })

  it('can be read', () => {
    expect(subject.givenName).toBe('Stella')
    expect(subject.familyName).toBe('Goldbacke')
  })

  it('can be set', () => {
    subject.givenName = 'Tom'
    expect(subject.name).toBe('Tom Goldbacke')
  })

  it('reads dates', () => {
    expect(subject.date).toBeInstanceOf(Date)
    expect(subject.date.toISOString()).toBe('2020-02-02T02:02:02.000Z')
  })

  it('reads datetimes', () => {
    expect(subject.dateTime).toBeInstanceOf(DateTime)
    expect(subject.dateTime.toISO()).toBe('2020-02-02T02:02:02.000Z')
  })
})
