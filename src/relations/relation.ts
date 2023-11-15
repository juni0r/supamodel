import { camelCase } from '../util'
import type { ModelClass, maybeArray } from '../types'

type RelationOptions = {
  key?: string
  foreignKey?: string
}

export class RelationProxy<T> implements PromiseLike<T> {
  target!: T
  result?: Promise<typeof this.target>
  loaded = false
  loading = false

  constructor(
    public relation: Relation,
    public source: InstanceType<(typeof relation)['source']>,
  ) {}

  load() {
    if (this.loading) return this.result!

    this.loading = true

    this.result = this.relation
      .loadTarget(this.source)
      .then((data) => {
        this.loaded = true
        return (this.target = data as typeof this.target)
      })
      .finally(() => {
        this.loading = false
      })

    return this.result
  }

  then<TResult1 = typeof this>(...args: Parameters<Promise<TResult1>['then']>) {
    this.result = (this.result ?? this.load()).then(...(args as any))
    return this
  }
}

export class Relation<
  Source extends ModelClass = ModelClass,
  Target extends ModelClass = ModelClass,
> {
  key: string
  foreignKey: string

  constructor(
    public source: Source,
    public target: Target,
    options: RelationOptions = {},
  ) {
    this.key = options.key ?? camelCase(`${target.name}_${target.primaryKey}`)
    this.foreignKey = options.foreignKey ?? target.primaryKey
  }

  get type() {
    return this.constructor as typeof Relation
  }

  scope(source: InstanceType<Source>): [string, any] {
    return [this.foreignKey, String((source as any)[this.key])]
  }

  createProxy(source: InstanceType<Source>): RelationProxy<any> {
    throw new Error('Subclasses of Relation have to implement createProxy')
    source
  }

  async loadTarget(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _source: InstanceType<Source>,
  ): Promise<maybeArray<InstanceType<Target>> | null> {
    return Promise.resolve(null)
  }
}
export default Relation
