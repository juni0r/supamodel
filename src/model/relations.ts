import forEach from 'lodash.foreach'
import type { Relations, RelationOptions } from '../types'
import { BaseClass } from './base'
import { New } from '../util'

export default <T extends BaseClass>(model: T) => {
  type MixinClass = typeof RelationsMixin

  class RelationsMixin extends model {
    static relations: Relations

    static defineRelations<T extends MixinClass, O extends RelationOptions>(
      this: T,
      options: O,
    ): T {
      this.relations = New<Relations>()
      forEach(options, ({ type, target, foreignKey = target.name }, key) => {
        this.relations[key] = new type(this, target, key, foreignKey)
      })
      return this
    }
  }
  return RelationsMixin
}
