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

describe('Attributes', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$takeAttributes({
      given_name: 'Stella',
      family_name: 'Goldbacke',
      date: '2020-02-02T02:02:02.020Z',
      date_time: '2020-02-02T02:02:02.020Z',
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

  it('takes dates', () => {
    expect(subject.date).toBeInstanceOf(Date)
  })

  it('emits dates', () => {
    expect(subject.$emitAttributes().date).toBe('2020-02-02T02:02:02.020Z')
  })

  it('takes datetimes', () => {
    expect(subject.dateTime).toBeInstanceOf(DateTime)
  })

  it('emits datetimes', () => {
    expect(subject.$emitAttributes().date_time).toBe('2020-02-02T02:02:02.020Z')
  })
})
