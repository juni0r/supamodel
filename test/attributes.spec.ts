import { describe, it, expect, beforeEach } from 'vitest'
import { model, z, $, datetime, transform, DateTime, Id } from '../src'
import { Expect } from './support/util'

const {
  string,
  date,
  number,
  ZodString,
  ZodNumber,
  ZodDate,
  ZodEffects,
  ZodDefault,
} = z

class Subject extends model({
  id: $(number()),
  givenName: $(string()),
  familyName: $(string(), { column: 'last_name' }),
  score: $(number().default(0)),
  date: $(date(), transform.date),
  dateTime: $(datetime(), transform.datetime),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Attributes', () => {
  let subject: Subject

  const isoDate = '2020-02-02T02:02:02.020Z'

  const date = new Date(isoDate)
  const dateTime = DateTime.fromISO(isoDate)

  const attributes = Object.freeze({
    id: 123,
    given_name: 'Stella',
    last_name: 'Goldbacke',
    score: 42,
    date: isoDate,
    date_time: isoDate,
  })

  describe('accessors', () => {
    beforeEach(() => {
      subject = new Subject(attributes)
    })

    it('can get', () => {
      expect(subject.$get('givenName')).toBe('Stella')
      Expect<string>(subject.$get('givenName'))
    })

    it('can set', () => {
      subject.$set('score', 99)
      expect(subject.score).toBe(99)

      Expect<(key: 'score', value: number) => void>(subject.$set<'score'>)
    })

    it('has getters', () => {
      const { $id, id, givenName, familyName, score, date, dateTime } = subject

      expect($id).toBe(123)
      expect(id).toBe(123)
      expect(givenName).toBe('Stella')
      expect(familyName).toBe('Goldbacke')
      expect(score).toBe(42)
      expect(date).toEqual(new Date(isoDate))
      expect(dateTime).toEqual(DateTime.fromISO(isoDate).toUTC())

      Expect<Id>($id)
      Expect<number>(id)
      Expect<string>(givenName)
      Expect<string>(familyName)
      Expect<number>(score)
      Expect<Date>(date)
      Expect<DateTime>(dateTime)
    })

    it('has setters', () => {
      subject.givenName = 'Tom'
      subject.familyName = 'Unfried'
      subject.score = 23
      subject.date = date
      subject.dateTime = dateTime

      expect(subject.$attributes).toEqual({
        id: 123,
        given_name: 'Tom',
        last_name: 'Unfried',
        score: 23,
        date: date,
        date_time: dateTime,
      })

      expect(subject.familyName).toBe('Unfried')
      expect(subject.score).toBe(23)
      expect(subject.date).toEqual(date)
      expect(subject.dateTime).toEqual(dateTime)
      expect(subject.givenName).toBe('Tom')
    })

    it('works with assign', () => {
      Object.assign(subject, {
        givenName: 'Tom',
        familyName: 'Unfried',
        score: 23,
        date,
        dateTime,
      })

      expect(subject.givenName).toBe('Tom')
      expect(subject.familyName).toBe('Unfried')
      expect(subject.score).toBe(23)
      expect(subject.date).toEqual(date)
      expect(subject.dateTime).toEqual(dateTime)
    })
  })

  describe('$take', () => {
    beforeEach(() => {
      subject = new Subject({})
    })

    it('assigns attributes', () => {
      subject.$take(attributes)

      expect(subject.$attributes).toEqual({
        id: 123,
        given_name: 'Stella',
        last_name: 'Goldbacke',
        score: 42,
        date: date,
        date_time: DateTime.fromISO(isoDate).toUTC(),
      })
    })
  })
})

describe('Static attributes', () => {
  it('maps attribute to column keys', () => {
    expect(Subject.attributeToColumn).toEqual({
      id: 'id',
      givenName: 'given_name',
      familyName: 'last_name',
      score: 'score',
      date: 'date',
      dateTime: 'date_time',
    })
  })

  it('maps column to attribute keys', () => {
    expect(Subject.columnToAttribute).toEqual({
      id: 'id',
      given_name: 'givenName',
      last_name: 'familyName',
      score: 'score',
      date: 'date',
      date_time: 'dateTime',
    })
  })

  it('transforms attributes', () => {
    const isoDate = '2020-02-02T20:20:20.020Z'
    const { transforms } = Subject

    const date = new Date(isoDate)
    expect(transforms.date.emit?.(date)).toBe(isoDate)

    const dateTime = DateTime.fromISO(isoDate)
    expect(transforms.date_time.emit?.(dateTime)).toBe(isoDate)
  })

  it('maps attribute keys to schemas', () => {
    const { id, givenName, familyName, score, date, dateTime } =
      Subject.schema.shape

    expect(id).toBeInstanceOf(ZodNumber)
    expect(givenName).toBeInstanceOf(ZodString)
    expect(familyName).toBeInstanceOf(ZodString)
    expect(date).toBeInstanceOf(ZodDate)

    expect(score).toBeInstanceOf(ZodDefault)
    expect(score._def.innerType).toBeInstanceOf(ZodNumber)
    expect(score._def.defaultValue()).toBe(0)

    expect(dateTime).toBeInstanceOf(ZodEffects)
  })
})
