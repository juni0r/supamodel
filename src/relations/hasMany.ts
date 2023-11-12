import { Relation } from './relation'
import type { ModelClass } from '../types'

export type HasManyRelation = typeof HasMany

export class HasMany<
  Source extends ModelClass,
  Target extends ModelClass,
> extends Relation<Source, Target> {
  async loadTarget(
    source: InstanceType<Source>,
  ): Promise<InstanceType<Target>[]> {
    const { data, error } = await this.target.findAll((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}

export class HasManyProxy<T> extends Array<T> implements PromiseLike<T> {
  private fetch: () => Promise<T[]>
  private result: ReturnType<typeof this.fetch>
  loaded = false
  loading = false

  constructor(fetch: () => Promise<T[]>, preload = true) {
    super()
    this.fetch = fetch
    this.result = Promise.resolve([])
    if (preload) this.load()
  }

  load() {
    if (this.loading) return this.result

    this.loading = true

    this.result = this.fetch()
      .then((data) => {
        this.length = 0
        this.push(...data)
        this.loaded = true
        return data
      })
      .finally(() => {
        this.loading = false
      })

    return this.result
  }

  then<TResult1 = typeof this>(...args: Parameters<Promise<TResult1>['then']>) {
    if (!this.loaded && !this.loading) {
      this.load()
    }
    this.result = this.result.then(...(args as any))
    return this
  }
}
