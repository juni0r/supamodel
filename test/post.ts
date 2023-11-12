import { defineModel, $, transforms } from '../src'
import { string, date, number } from 'zod'
import { hasMany } from '../src/relations'
import Comment from './comment'

export default defineModel({ attributes: {} })
  .defineRelations({
    comments: hasMany(() => Comment),
  })
  .withAttributes({
    id: $(number().int().optional()),
    title: $(string().min(1)),
    createdAt: $(
      date().default(() => new Date()),
      transforms.date,
    ),
  })
