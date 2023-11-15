import { mix, mixin } from 'mixwith.ts'

import { Issues } from '../issues'
import { DirtyDict, Dict } from '../util'

import merge from 'lodash.merge'
import result from 'lodash.result'
import forEach from 'lodash.foreach'
import transform from 'lodash.transform'

import type {
  ModelOptions,
  Attributes,
  ZodObjectOf,
  DefaultsOf,
  KeyMapper,
  ToJSON,
  ScopeOf,
  TransformsOf,
} from '../types'

export type BaseClass = typeof Base

export class Base {
  static naming: KeyMapper
  static schema: ZodObjectOf<Attributes>
  static transforms: TransformsOf<Attributes>
  static defaults: DefaultsOf<Attributes>
  static scope: ScopeOf<Attributes>

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

  static with<
    This extends BaseClass,
    A extends BaseClass,
    B extends BaseClass,
    C extends BaseClass,
    D extends BaseClass,
    E extends BaseClass,
    F extends BaseClass,
  >(
    this: This,
    a: mixin<This, A>,
    b?: mixin<A, B>,
    c?: mixin<B, C>,
    d?: mixin<C, D>,
    e?: mixin<D, E>,
    f?: mixin<E, F>,
  ) {
    return mix(this).with<A, B, C, D, E, F>(a, b, c, d, e, f)
  }
}
export default Base
