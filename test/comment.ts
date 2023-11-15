import { defineModel, $, transforms } from '../src'
import { string, date, number } from 'zod'
import { belongsTo } from '../src/relations'
import { Post } from '.'

export class Comment extends defineModel({
  id: $(number().int().optional()),
  postId: $(number().int()),
  text: $(string().min(1)),
  createdAt: $(
    date().default(() => new Date()),
    transforms.date,
  ),
}) {
  static relations = {
    post: belongsTo(() => Post),
  }
}
