import { describe, it, expect, beforeEach } from 'vitest'
import { defineModel, attr as $ } from '../src'
import { datetime, transform } from '../src/schema'
import { string, date } from 'zod'

class Subject extends defineModel({
  givenName: $(string().trim().min(1)),
  familyName: $(string().nullable()),
  date: $(date(), transform.date),
  dateTime: $(datetime(), transform.datetime),
}) {}

describe('Validation', () => {
  let subject: Subject

  beforeEach(() => {
    subject = new Subject()
    subject.$takeAttributes({
      given_name: 'Stella',
      family_name: null,
      date: '2020-02-02T02:02:02.020Z',
      date_time: '2020-02-02T02:02:02.020Z',
    })
  })

  it('has issues', async () => {
    const issues = await subject.validate()
    expect(issues.any).toBe(false)
    expect(issues.none).toBe(true)
  })

  it('assigns parsed values', async () => {
    subject.givenName = ' \t Tom  \n  '
    const issues = await subject.validate()

    expect(issues.none).toBe(true)
    expect(subject.givenName).toBe('Tom')
  })

  it('creates an issue for a required attribute', async () => {
    subject.givenName = ''
    const issues = await subject.validate()

    expect(issues.any).toBe(true)
    expect(issues.length).toBe(1)
    expect(issues[0]).toMatchObject({
      path: ['givenName'],
      code: 'too_small',
    })
  })

  it('creates an issue for an attribute type mismatch', async () => {
    // @ts-expect-error for intenionally assigning invalid value
    subject.date = '2020-02-02'
    const issues = await subject.validate()

    expect(issues.any).toBe(true)
    expect(issues.length).toBe(1)
    expect(issues[0]).toMatchObject({
      path: ['date'],
      code: 'invalid_type',
    })
  })
})
