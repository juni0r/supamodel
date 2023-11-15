import { Relation, RelationProxy } from './relation'
import type { ModelClass } from '../types'

export type HasManyRelation = typeof HasMany

export class HasManyProxy<T> extends RelationProxy<T[]> {
  target = []

  constructor(
    relation: HasMany,
    source: InstanceType<(typeof relation)['source']>,
  ) {
    super(relation, source)
  }
}
export class HasMany<
  Source extends ModelClass = ModelClass,
  Target extends ModelClass = ModelClass,
> extends Relation<Source, Target> {
  createProxy(source: InstanceType<Source>) {
    return new HasManyProxy<InstanceType<Target>>(this, source)
  }

  async loadTarget(source: InstanceType<Source>) {
    const { data, error } = await this.target.findAll((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}
