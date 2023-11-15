import forEach from 'lodash.foreach'
import type { Relations, RelationOptions } from '../types'
import { BaseClass } from './base'
import { New } from '../util'

export default <Rels extends RelationOptions>(relations: Rels) => {
  return <T extends BaseClass>(model: T) => {
    // type MixinClass = typeof RelationsMixin

    class RelationsMixin extends model {
      static relations = New<Relations>()
    }

    forEach(relations, ({ type, target, foreignKey = target.name }, key) => {
      RelationsMixin.relations[key] = new type(
        RelationsMixin,
        target,
        key,
        foreignKey,
      )
    })

    return RelationsMixin
  }
}
