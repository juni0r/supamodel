// import 'dotenv/config'
import './luxon.inspect.custom'

import {
  coerce,
  string,
  ZodEffects,
  type TypeOf,
  type ZodTypeAny,
  number,
  date,
  object,
  ZodObject,
  custom,
  ZodType,
  ZodTypeDef,
} from 'zod'

import mapValues from 'lodash.mapvalues'
import { Simplify } from './types'
import { DateTime } from 'luxon'
import { dateTimeFromISO } from './schema'

type Attribute<Z extends ZodTypeAny = ZodTypeAny> = Z | [Z, string]
type Attributes = Record<string, Attribute>

type ShapeOf<A extends Attributes> = Simplify<{
  [k in keyof A]: A[k] extends ZodTypeAny
    ? A[k]
    : A[k] extends [ZodTypeAny, string]
    ? A[k][0]
    : never
}>

type ZodObjectOf<A extends Attributes> = ZodObject<ShapeOf<A>>

function shapeFrom<A extends Attributes>(attributes: A): ShapeOf<A> {
  return mapValues(attributes, (attr) =>
    Array.isArray(attr) ? attr[0] : attr,
  ) as any
}

function schemaFrom<A extends Attributes>(attributes: A): ZodObjectOf<A> {
  return object(shapeFrom(attributes)) as any
}

const now = () => new Date()

type ZodDateTime = ZodType<DateTime, ZodTypeDef, DateTime>

function dateTime({ coerce = false } = {}) {
  const type = custom<DateTime>(
    (val: unknown) => (val instanceof DateTime ? val.isValid : false),
    { message: 'Invalid DateTime', params: { code: 'invalid-datetime' } },
  ) as ZodDateTime & {
    _def: ZodDateTime['_def'] & { coerce: boolean }
  }
  const { _parse } = type

  type._def.coerce = coerce

  type._parse = function (input: Parameters<typeof _parse>[0]) {
    if (type._def.coerce) {
      input.data = dateTimeFromISO(input.data)
    }
    return _parse.call(type, input)
  }

  return type
}

const schema = schemaFrom({
  name: string().min(2),
  nick: string().min(4).nullish(),
  score: [number().nonnegative().int().default(0), 'tally'],
  date: coerce.date().default(now).nullish(),
  dateTime: dateTime({ coerce: true }).default(() => DateTime.now().toUTC()),
})

console.log(
  schema.parse({
    name: 'Frederico',
    nick: 'Freddy',
    score: 23,
    date: '2023-12-18T12:00:00',
  }),
)
export type S = TypeOf<typeof schema>

const prop = schema.shape.date

// import { configureSupamodel } from './config'

// const { SUPABASE_URL: url = '', SUPABASE_KEY: key = '' } = process.env

// configureSupamodel({ client: { key, url } })

// import('./session').then(async ({ default: Session }) => {
//   Session.signInWithPassword({
//     email: 'andreas.korth@gmail.com',
//     password: 'rosebush',
//   }).then(async (session) => {
//     console.dir(session.toJSON(), { depth: 5 })
//   })
// })
// import { defineModel } from './config'

// const H = class extends defineModel({ attributes: {} }) {
//   static name = 'Hollo'
// }.configure({})
