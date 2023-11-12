import { camelCase } from '../util'
import type { ModelClass, maybeArray } from '../types'

type RelationOptions = {
  key?: string
  foreignKey?: string
}

export class Relation<
  Source extends ModelClass = ModelClass,
  Target extends ModelClass = ModelClass,
> {
  public key: string
  public foreignKey: string

  constructor(
    public source: Source,
    public target: Target,
    options: RelationOptions = {},
  ) {
    this.key = options.key ?? camelCase(`${target.name}_${target.primaryKey}`)
    this.foreignKey = options.foreignKey ?? target.primaryKey
  }

  scope(source: InstanceType<Source>): [string, any] {
    return [this.foreignKey, String((source as any)[this.key])]
  }

  createProxy() {
    return new RelationProxy(this)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  loadTarget(_source: InstanceType<Source>) {
    return Promise.resolve(null) as Promise<maybeArray<
      InstanceType<Target>
    > | null>
  }
}
export default Relation

export class RelationProxy<T> implements PromiseLike<T> {
  result: Promise<T | null>
  loaded = false
  loading = false

  constructor(
    public relation: Relation, // public source: InstanceType<(typeof relation)['source']>,
  ) {
    this.result = Promise.resolve(null)
  }

  load() {
    if (this.loading) return this.result

    this.loading = true

    // this.result = this.relation
    //   .loadTarget()
    //   .then((data) => {
    //     this.loaded = true
    //     return this.loadDone(data)
    //   })
    //   .finally(() => {
    //     this.loading = false
    //   })

    return this.result
  }

  protected loadDone(data: Awaited<typeof this.result>) {
    return data
  }

  then<TResult1 = typeof this>(...args: Parameters<Promise<TResult1>['then']>) {
    if (!this.loaded && !this.loading) {
      this.load()
    }
    this.result = this.result.then(...(args as any))
    return this
  }
}
