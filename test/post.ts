import { defineModel, $, transforms } from '../src'
import { string, date, number } from 'zod'
import { hasMany } from '../src/relations'
import { Comment } from '.'

export class Post extends defineModel({
  id: $(number().int().optional()),
  title: $(string().min(1)),
  createdAt: $(
    date().default(() => new Date()),
    transforms.date,
  ),
}) {
  static relations = {
    comments: hasMany(() => Comment),
  }
}
