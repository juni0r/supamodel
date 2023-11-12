import { Issues } from '../issues'
import { DirtyDict, Dict } from '../util'

import merge from 'lodash.merge'
import result from 'lodash.result'
import forEach from 'lodash.foreach'

import type {
  ModelOptions,
  Attributes,
  Transform,
  ZodObjectOf,
  DefaultsOf,
  KeyMapper,
  ToJSON,
} from '../types'
import transform from 'lodash.transform'

export type BaseClass = typeof Base

export class Base {
  static schema: ZodObjectOf<Attributes>
  static transforms: Dict<Transform>
  static defaults: DefaultsOf<Attributes>
  static naming: KeyMapper
  static scope: Dict

  /**
   * This constructor signature is required in order to use Model as a
   * mixin class (i.e. defining an anonymous class that extends Model).
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(..._args: any[]) {}

  $attributes = DirtyDict()

  get $model() {
    return this.constructor as BaseClass
  }

  get $isDirty() {
    return this.$attributes.$isDirty
  }

  get $changes() {
    return this.$attributes.$changes
  }

  $didChange(key: string) {
    return this.$attributes.$didChange(key)
  }

  $initial(key: string) {
    return key in this.$attributes.$initial
      ? this.$attributes.$initial[key]
      : this.$attributes[key]
  }

  $commit<T extends Base>(this: T) {
    this.$attributes.$commit()
    return this
  }

  $revert<T extends Base>(this: T) {
    this.$attributes.$revert()
    return this
  }

  $emit({ onlyChanges = false }: { onlyChanges?: boolean } = {}) {
    const { transforms } = this.$model

    return transform(
      onlyChanges ? this.$attributes.$changes : this.$attributes,
      (emit, value, key) => {
        const transform = transforms[key]
        emit[transform.column] = transform.emit(value)
      },
      {} as Dict,
    )
  }

  $take<T extends Base>(this: T, values: Dict) {
    forEach(this.$model.transforms, ({ column, take }, key) => {
      if (column in values) {
        this.$attributes[key] = take(values[column])
      }
    })
    this.$attributes.$commit()
    return this
  }

  $takeDefaults<T extends Base>(this: T, values?: Dict) {
    if (values) this.$take(values)

    const { defaults } = this.$model

    for (const key in defaults) {
      if (this.$attributes[key] === undefined) {
        this.$attributes[key] = defaults[key]()
      }
    }
    return this
  }

  $parse() {
    return this.$model.schema.parse(this)
  }

  validate() {
    try {
      Object.assign(this, this.$parse())
    } catch (error) {
      return Issues.handle(error)
    }
    return Issues.None
  }

  toJSON(): ToJSON {
    return Object.entries(this.$attributes).reduce(
      (json, [key, value]) => ({
        ...json,
        [key]: result(value, 'toJSON', value),
      }),
      {},
    )
  }

  static take<T extends BaseClass>(this: T, values: Dict) {
    return new this().$take(values) as InstanceType<T>
  }

  static takeDefaults<T extends BaseClass>(this: T, values?: Dict) {
    return new this().$takeDefaults(values) as InstanceType<T>
  }

  static configure<Attrs extends Attributes>(options: ModelOptions<Attrs>) {
    return merge(this, options)
  }
}
export default Base
