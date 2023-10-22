import { describe, it, expect, beforeEach } from 'vitest'
import { date, model, string } from '../src/model'

class Subject extends model({
  givenName: string(),
  familyName: string(),
  createdAt: {
    type: date(),
    transform: {
      consume: (iso: string) => new Date(iso),
      emit: (date: Date) => date?.toISOString(),
    },
  },
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Model attributes', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$attributes = {
      given_name: 'Stella',
      family_name: 'Goldbacke',
      created_at: '2020-02-02T02:02:02Z',
    }
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
    expect(subject.createdAt).toBeInstanceOf(Date)
  })
})
