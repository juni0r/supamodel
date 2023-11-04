import { describe, it, expect, beforeEach } from 'vitest'
import { defineModel, $, z, datetime, transform, DateTime, ID } from '../src'
import { Expect } from './support/util'

import configureSupamodel from './support/configureSupamodel'

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

describe('Attributes', () => {
  configureSupamodel()

  class Subject extends defineModel({
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
        given_name: 'Tom',
        last_name: 'Unfried',
        score: 23,
        date: new Date(iso),
        date_time: DateTime.fromISO(iso),
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
        given_name: 'Stella',
        last_name: 'Goldbacke',
        score: 42,
        date: jsdate,
        date_time: DateTime.fromISO(isoDate).toUTC(),
      })
    })
  })

  describe('static', () => {
    it('maps attribute to column keys', () => {
      expect(Subject.columnNameOf).toEqual({
        id: 'id',
        givenName: 'given_name',
        familyName: 'last_name',
        score: 'score',
        date: 'date',
        dateTime: 'date_time',
      })
    })

    it('maps column to attribute keys', () => {
      expect(Subject.attributeNameOf).toEqual({
        id: 'id',
        given_name: 'givenName',
        last_name: 'familyName',
        score: 'score',
        date: 'date',
        date_time: 'dateTime',
      })
    })

    it('transforms attributes', () => {
      const { transforms } = Subject

      const isoDate = '2020-02-02T20:20:20.020Z'

      const date = new Date(isoDate)
      expect(transforms.date.emit?.(date)).toBe(isoDate)

      const dateTime = DateTime.fromISO(isoDate)
      expect(transforms.date_time.emit?.(dateTime)).toBe(isoDate)
    })

    it('maps attribute keys to schemas', () => {
      const { shape } = Subject.schema

      expect(shape.id).toBeInstanceOf(ZodNumber)
      expect(shape.givenName).toBeInstanceOf(ZodString)
      expect(shape.familyName).toBeInstanceOf(ZodString)
      expect(shape.date).toBeInstanceOf(ZodDate)

      expect(shape.score).toBeInstanceOf(ZodDefault)
      expect(shape.score._def.innerType).toBeInstanceOf(ZodNumber)
      expect(shape.score._def.defaultValue()).toBe(0)

      expect(shape.dateTime).toBeInstanceOf(ZodEffects)
    })
  })
})
