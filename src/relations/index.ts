import { HasMany, type HasManyRelation } from './hasMany'
import { BelongsTo, type BelongsToRelation } from './belongsTo'

import type { ModelClass, ClassProxy, RelationOption } from '../types'

export { Relation } from './relation'

export function hasMany<T extends ModelClass>(
  target: ClassProxy<T>,
  foreignKey = 'id',
): RelationOption<HasManyRelation, T> {
  return {
    type: HasMany,
    target,
    foreignKey: foreignKey as any,
  }
}

export function belongsTo<T extends ModelClass>(
  target: ClassProxy<T>,
  foreignKey = 'id',
): RelationOption<BelongsToRelation, T> {
  return {
    type: BelongsTo,
    target,
    foreignKey: foreignKey as any,
  }
}
