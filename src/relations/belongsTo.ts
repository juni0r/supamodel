import { Relation, type ModelClass } from './relation'

export class BelongsTo<
  Source extends ModelClass,
  Target extends ModelClass,
> extends Relation<Source, Target> {
  async loadTarget(
    source: InstanceType<Source>,
  ): Promise<InstanceType<Target> | null> {
    const { data, error } = await this.target.findOne((where) =>
      where.eq(...this.scope(source)),
    )
    if (error) throw error
    return data
  }
}
export default BelongsTo

export class BelongsToProxy<T> implements PromiseLike<T> {
  private fetch: () => Promise<T | null>
  private result: ReturnType<typeof this.fetch>

  target: T | null = null
  loaded = false
  loading = false

  constructor(fetch: () => Promise<T>, preload = true) {
    this.fetch = fetch
    this.result = Promise.resolve(null)
    if (preload) this.load()
  }

  load() {
    if (this.loading) return this.result

    this.loading = true

    this.result = this.fetch()
      .then((target) => {
        this.loaded = true
        return (this.target = target)
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

// import { Record } from '../../test/models'

// const bt = new BelongsToProxy(() =>
//   Promise.resolve(Record.takeDefaults({ name: 'Danny' })),
// )

// ;(async function () {
//   console.log(bt.loaded)
//   console.log(await bt)
//   console.log(bt.loaded)
//   console.log(bt)
// })()
