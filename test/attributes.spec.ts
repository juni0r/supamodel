// import { setup } from '@nuxt/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import { model, string } from '../src/model'

class Subject extends model({
  givenName: string(),
  familyName: string(),
}) {
  get name() {
    return `${this.givenName} ${this.familyName}`
  }
}

describe('Model', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$attributes = { given_name: 'Stella', family_name: 'Goldbacke' }
  })

  it('gets attributes', () => {
    expect(subject.givenName).toBe('Stella')
    expect(subject.familyName).toBe('Goldbacke')
  })

  it('sets attributes', () => {
    subject.givenName = 'Tom'
    expect(subject.name).toBe('Tom Goldbacke')
  })
})
