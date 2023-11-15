import { Relation, RelationProxy } from './relation'
import type { ModelClass } from '../types'

export type BelongsToRelation = typeof BelongsTo

export class BelongsToProxy<T> extends RelationProxy<T | null> {
  target = null

  constructor(
    relation: BelongsTo,
    source: InstanceType<(typeof relation)['source']>,
  ) {
    super(relation, source)
  }
}

export class BelongsTo<
  Source extends ModelClass = ModelClass,
  Target extends ModelClass = ModelClass,
> extends Relation<Source, Target> {
  createProxy(source: InstanceType<Source>) {
    return new BelongsToProxy<InstanceType<Target>>(this, source)
  }

  async loadTarget(source: InstanceType<Source>) {
    const { data, error } = await this.target.findOne((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}
export default BelongsTo
