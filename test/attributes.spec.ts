import { describe, it, expect, beforeEach } from 'vitest'
import { Expect } from './support/util'
import { z, DateTime, ID } from '../src'
import { Subject } from './models'

const { ZodString, ZodNumber, ZodDate, ZodEffects, ZodDefault } = z

describe('Attributes', () => {
  let subject: Subject

  const isoDate = '2020-02-02T02:02:02.020Z'
  const jsdate = new Date(isoDate)
  const dateTime = DateTime.fromISO(isoDate).toUTC()

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
      subject = Subject.take(attributes)
    })

    it('can get', () => {
      expect(subject.$get('givenName')).toBe('Stella')

      Expect<string>()(subject.$get('givenName'))
    })

    it('can set', () => {
      subject.$set('score', 99)
      expect(subject.score).toBe(99)
    })

    it('has getters', () => {
      expect(subject.$id).toBe(123)
      expect(subject.id).toBe(123)
      expect(subject.givenName).toBe('Stella')
      expect(subject.familyName).toBe('Goldbacke')
      expect(subject.score).toBe(42)
      expect(subject.date).toEqual(new Date(isoDate))
      expect(subject.dateTime).toEqual(DateTime.fromISO(isoDate).toUTC())

      Expect<ID>()(subject.$id)
      Expect<number>()(subject.id)
      Expect<string>()(subject.givenName)
      Expect<string>()(subject.familyName)
      Expect<number>()(subject.score)
      Expect<Date>()(subject.date)
      Expect<DateTime>()(subject.dateTime)
    })

    it('has setters', () => {
      const iso = '2121-12-12T12:12:12.121Z'

      subject.givenName = 'Tom'
      subject.familyName = 'Unfried'
      subject.score = 23
      subject.date = new Date(iso)
      subject.dateTime = DateTime.fromISO(iso)

      expect(subject.$attributes).toEqual({
        id: 123,
        givenName: 'Tom',
        familyName: 'Unfried',
        score: 23,
        date: new Date(iso),
        dateTime: DateTime.fromISO(iso),
      })

      const { $set } = subject

      Expect<(key: 'id', value: number) => void>()($set<'id'>)
      Expect<(key: 'givenName', value: string) => void>()($set<'givenName'>)
      Expect<(key: 'familyName', value: string) => void>()($set<'familyName'>)
      Expect<(key: 'score', value: number) => void>()($set<'score'>)
      Expect<(key: 'date', value: Date) => void>()($set<'date'>)
      Expect<(key: 'dateTime', value: DateTime) => void>()($set<'dateTime'>)
    })

    it('works with assign', () => {
      Object.assign(subject, {
        givenName: 'Tom',
        familyName: 'Unfried',
        score: 23,
        date: jsdate,
        dateTime,
      })

      expect(subject.givenName).toBe('Tom')
      expect(subject.familyName).toBe('Unfried')
      expect(subject.score).toBe(23)
      expect(subject.date).toEqual(jsdate)
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
        givenName: 'Stella',
        familyName: 'Goldbacke',
        score: 42,
        date: jsdate,
        dateTime: DateTime.fromISO(isoDate).toUTC(),
      })
    })
  })

  describe('static', () => {
    it('transforms attribute', () => {
      const { transforms } = Subject
      expect(
        Object.fromEntries(
          Object.entries(transforms).map(([key, { column }]) => [key, column]),
        ),
      ).toEqual({
        id: 'id',
        givenName: 'given_name',
        familyName: 'last_name',
        score: 'score',
        date: 'date',
        dateTime: 'date_time',
      })

      Expect<(value: any) => number>()(transforms.id.take)
      Expect<(value: number) => any>()(transforms.id.emit)

      Expect<(value: any) => string>()(transforms.givenName.take)
      Expect<(value: string) => any>()(transforms.givenName.emit)

      Expect<(value: any) => string>()(transforms.familyName.take)
      Expect<(value: string) => any>()(transforms.familyName.emit)

      Expect<(value: any) => number>()(transforms.score.take)
      Expect<(value: number) => any>()(transforms.score.emit)

      Expect<(value: any) => Date>()(transforms.date.take)
      Expect<(value: Date) => any>()(transforms.date.emit)

      Expect<(value: any) => DateTime>()(transforms.dateTime.take)
      Expect<(value: DateTime) => any>()(transforms.dateTime.emit)
    })

    it('maps attribute keys to schemas', () => {
      const { shape } = Subject.schema

      expect(shape.id).toBeInstanceOf(ZodNumber)
      expect(shape.givenName).toBeInstanceOf(ZodString)
      expect(shape.familyName).toBeInstanceOf(ZodString)
      expect(shape.date).toBeInstanceOf(ZodDate)
      expect(shape.dateTime).toBeInstanceOf(ZodEffects)
      expect(shape.score).toBeInstanceOf(ZodDefault)
      expect(shape.score.removeDefault()).toBeInstanceOf(ZodNumber)
      expect(shape.score.parse(undefined)).toBe(0)
    })

    it('takes defaults', () => {
      subject = Subject.takeDefaults()

      expect(subject.$attributes).toEqual({ score: 0 })
      expect(subject.$changes).toEqual({ score: 0 })
      expect(subject.$isDirty).toBe(true)

      expect(Subject.defaults.score()).toBe(0)

      Expect<() => number>()(Subject.defaults.score)
    })
  })
})
